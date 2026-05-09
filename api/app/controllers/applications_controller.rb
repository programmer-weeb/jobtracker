class ApplicationsController < ApplicationController
  class InvalidAssociationError < StandardError; end

  POSITION_STEP = 1024
  BOOLEAN_TRUE_VALUES = %w[true 1].freeze
  BOOLEAN_FALSE_VALUES = %w[false 0].freeze

  before_action :authenticate_user!
  before_action :set_application, only: %i[show update destroy move]

  def index
    applications = filtered_applications
    page = [(normalized_integer_param(params[:page]) || 1), 1].max
    per_page = [[normalized_integer_param(params[:per_page]) || 25, 1].max, 100].min
    total = applications.count

    paginated = applications.offset((page - 1) * per_page).limit(per_page)

    render json: {
      data: paginated.map { |application| application_payload(application) },
      meta: { page:, per_page:, total: }
    }, status: :ok
  end

  def show
    authorize @application
    render json: { data: application_payload(@application, include_notes: true, include_events: true) }, status: :ok
  end

  def create
    application = current_user.applications.new(sanitized_application_params)
    authorize application
    Application.transaction do
      if application.save
        create_status_changed_event!(application, previous_status: nil)
        render json: { data: application_payload(application) }, status: :created
      else
        render json: { errors: application.errors.full_messages }, status: :unprocessable_content
      end
    end
  rescue InvalidAssociationError => e
    render json: { errors: [e.message] }, status: :unprocessable_content
  end

  def update
    authorize @application
    previous_status = @application.status
    Application.transaction do
      if @application.update(sanitized_application_params)
        create_status_changed_event!(@application, previous_status: previous_status) if previous_status != @application.status
        render json: { data: application_payload(@application) }, status: :ok
      else
        render json: { errors: @application.errors.full_messages }, status: :unprocessable_content
      end
    end
  rescue InvalidAssociationError => e
    render json: { errors: [e.message] }, status: :unprocessable_content
  rescue ArgumentError => e
    render json: { errors: [ e.message ] }, status: :unprocessable_content
  end

  def destroy
    authorize @application
    @application.destroy!
    head :no_content
  end

  def move
    authorize @application

    unless move_payload_valid?
      return render json: { errors: move_payload_errors }, status: :unprocessable_content
    end

    Application.transaction do
      target_status = move_status_value
      target_index = move_index_value

      sibling_scope = policy_scope(Application)
        .where(status: target_status)
        .where.not(id: @application.id)
        .order(:position, :id)
        .lock

      siblings = sibling_scope.to_a
      insert_at = [[target_index, 0].max, siblings.length].min
      new_position = next_position_for(siblings, insert_at)

      if new_position.nil?
        rebalance_positions!(siblings)
        siblings = sibling_scope.to_a
        new_position = next_position_for(siblings, insert_at)
      end

      previous_status = @application.status
      unless @application.update(status: target_status, position: new_position)
        render json: { errors: @application.errors.full_messages }, status: :unprocessable_content
        raise ActiveRecord::Rollback
      end
      create_status_changed_event!(@application, previous_status: previous_status) if previous_status != @application.status
    end

    @application.reload
    render json: { data: application_payload(@application) }, status: :ok
  end

  private

  def set_application
    @application = policy_scope(Application).includes(:company, :tags, :events, :notes).find(params[:id])
  end

  def application_params
    # Status is only allowed on create; update must use /move endpoint
    allowed = [:company_id, :title, :source, :salary_min, :salary_max,
               :currency, :remote, :location, :url, :applied_at, tag_ids: []]
    allowed.insert(2, :status) if action_name == "create"
    params.require(:application).permit(*allowed)
  end

  def sanitized_application_params
    permitted = application_params.to_h
    errors = []

    if permitted.key?("company_id")
      company = current_user.companies.find_by(id: permitted["company_id"])
      if company.nil?
        errors << "Company must belong to current user"
      else
        permitted["company_id"] = company.id
      end
    end

    if permitted.key?("tag_ids")
      requested_tag_ids = Array(permitted["tag_ids"]).reject(&:blank?).map { |id| Integer(id, exception: false) }
      if requested_tag_ids.any?(&:nil?)
        errors << "Tag ids must be valid integers"
      else
        owned_tag_ids = current_user.tags.where(id: requested_tag_ids).pluck(:id)
        invalid_tag_ids = requested_tag_ids.uniq - owned_tag_ids
        errors << "Tags must belong to current user: #{invalid_tag_ids.join(', ')}" if invalid_tag_ids.any?
        permitted["tag_ids"] = requested_tag_ids
      end
    end

    raise InvalidAssociationError, errors.join(". ") if errors.any?

    permitted
  end

  def filtered_applications
    applications = policy_scope(Application).includes(:company, :tags).order(created_at: :desc)
    authorize Application

    status = normalized_status_param
    applications = applications.where(status: status) if status

    company_id = normalized_integer_param(params[:company])
    applications = applications.where(company_id: company_id) if company_id

    tag_id = normalized_integer_param(params[:tag])
    applications = applications.joins(:tags).where(tags: { id: tag_id }) if tag_id

    remote = normalized_remote_param
    if remote != :invalid
      applications = applications.where(remote: remote)
    end

    query_param = params[:q].to_s.strip
    if query_param.present?
      query = "%#{ActiveRecord::Base.sanitize_sql_like(query_param)}%"
      applications = applications.joins(:company)
        .where("applications.title ILIKE :q OR applications.source ILIKE :q OR applications.location ILIKE :q OR companies.name ILIKE :q", q: query)
    end

    applications.distinct
  end

  def move_params
    params.require(:application)
  end

  def move_payload_errors
    errors = []
    errors << "Status is required" unless move_params.key?(:status)
    errors << "Status is invalid" if move_params.key?(:status) && !Application.statuses.key?(move_params[:status].to_s)
    errors << "Position is required" unless move_params.key?(:position)

    if move_params.key?(:position)
      position = normalized_integer_param(move_params[:position])
      errors << "Position must be a non-negative integer" if position.nil? || position.negative?
    end

    errors
  rescue ActionController::ParameterMissing
    [ "Application payload is required" ]
  end

  def move_payload_valid?
    move_payload_errors.empty?
  end

  def move_status_value
    move_params[:status]
  end

  def move_index_value
    normalized_integer_param(move_params[:position])
  end

  def normalized_status_param
    value = params[:status].to_s
    return nil if value.blank?

    Application.statuses.key?(value) ? value : nil
  end

  def normalized_integer_param(value)
    return nil if value.blank?

    Integer(value, exception: false)
  end

  def normalized_remote_param
    value = params[:remote].to_s.strip.downcase
    return :invalid if value.blank?
    return true if BOOLEAN_TRUE_VALUES.include?(value)
    return false if BOOLEAN_FALSE_VALUES.include?(value)

    :invalid
  end

  def next_position_for(records, insert_at)
    prev_position = insert_at.positive? ? records[insert_at - 1].position : nil
    next_position = insert_at < records.length ? records[insert_at].position : nil

    return 0 if prev_position.nil? && next_position.nil?
    return next_position - POSITION_STEP if prev_position.nil?
    return prev_position + POSITION_STEP if next_position.nil?

    gap = next_position - prev_position
    return nil if gap <= 1

    prev_position + (gap / 2)
  end

  def rebalance_positions!(records)
    records.each_with_index do |record, index|
      record.update_column(:position, index * POSITION_STEP)
    end
  end

  def application_payload(application, include_notes: false, include_events: false)
    include_payload = {
      company: { only: %i[id name website location] },
      tags: { only: %i[id name color] }
    }
    include_payload[:notes] = { only: %i[id application_id body created_at updated_at] } if include_notes
    include_payload[:events] = { only: %i[id kind payload created_at updated_at] } if include_events

    application.as_json(
      only: %i[id user_id company_id title status source salary_min salary_max currency remote location url applied_at position created_at updated_at],
      include: include_payload
    )
  end

  def create_status_changed_event!(application, previous_status:)
    application.events.create!(
      kind: :status_changed,
      payload: {
        from: previous_status,
        to: application.status
      }
    )
  end
end

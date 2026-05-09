class ApplicationsController < ApplicationController
  POSITION_STEP = 1024
  BOOLEAN_TRUE_VALUES = %w[true 1].freeze
  BOOLEAN_FALSE_VALUES = %w[false 0].freeze

  before_action :authenticate_user!
  before_action :set_application, only: %i[show update destroy move]

  def index
    applications = filtered_applications
    render json: {
      data: applications.map { |application| application_payload(application) }
    }, status: :ok
  end

  def show
    authorize @application
    render json: { data: application_payload(@application, include_notes: true) }, status: :ok
  end

  def create
    application = current_user.applications.new(application_params)
    authorize application
    if application.save
      render json: { data: application_payload(application) }, status: :created
    else
      render json: { errors: application.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    authorize @application
    if @application.update(application_params)
      render json: { data: application_payload(@application) }, status: :ok
    else
      render json: { errors: @application.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    authorize @application
    @application.destroy!
    head :no_content
  end

  def move
    authorize @application

    unless move_payload_valid?
      return render json: { errors: move_payload_errors }, status: :unprocessable_entity
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

      unless @application.update(status: target_status, position: new_position)
        render json: { errors: @application.errors.full_messages }, status: :unprocessable_entity
        raise ActiveRecord::Rollback
      end
    end

    @application.reload
    render json: { data: application_payload(@application) }, status: :ok
  end

  private

  def set_application
    @application = policy_scope(Application).includes(:company, :tags).find(params[:id])
  end

  def application_params
    params.require(:application).permit(:company_id, :title, :status, :source, :salary_min, :salary_max,
                                        :currency, :remote, :location, :url, :applied_at, :position, tag_ids: [])
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

  def application_payload(application, include_notes: false)
    include_payload = {
      company: { only: %i[id name website location] },
      tags: { only: %i[id name color] }
    }
    include_payload[:notes] = { only: %i[id application_id body created_at updated_at] } if include_notes

    application.as_json(
      only: %i[id user_id company_id title status source salary_min salary_max currency remote location url applied_at position created_at updated_at],
      include: include_payload
    )
  end
end

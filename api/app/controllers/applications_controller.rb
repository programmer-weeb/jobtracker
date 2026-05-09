class ApplicationsController < ApplicationController
  POSITION_STEP = 1024

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

    Application.transaction do
      target_status = move_status
      target_index = move_index

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

    applications = applications.where(status: params[:status]) if params[:status].present?
    applications = applications.where(company_id: params[:company]) if params[:company].present?
    applications = applications.joins(:tags).where(tags: { id: params[:tag] }) if params[:tag].present?

    if params[:remote].present?
      remote = ActiveModel::Type::Boolean.new.cast(params[:remote])
      applications = applications.where(remote: remote)
    end

    if params[:q].present?
      query = "%#{ActiveRecord::Base.sanitize_sql_like(params[:q].strip)}%"
      applications = applications.joins(:company)
        .where("applications.title ILIKE :q OR applications.source ILIKE :q OR applications.location ILIKE :q OR companies.name ILIKE :q", q: query)
    end

    applications.distinct
  end

  def move_status
    value = params.require(:application).fetch(:status)
    Application.statuses.key?(value) ? value : @application.status
  end

  def move_index
    params.require(:application).fetch(:position, 0).to_i
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

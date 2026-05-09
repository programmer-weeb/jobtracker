class ApplicationsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_application, only: %i[show update destroy move]

  def index
    applications = current_user.applications.includes(:company, :tags).order(created_at: :desc)
    render json: {
      data: applications.map { |application| application_payload(application) }
    }, status: :ok
  end

  def show
    render json: { data: application_payload(@application) }, status: :ok
  end

  def create
    application = current_user.applications.new(application_params)
    if application.save
      render json: { data: application_payload(application) }, status: :created
    else
      render json: { errors: application.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @application.update(application_params)
      render json: { data: application_payload(@application) }, status: :ok
    else
      render json: { errors: @application.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @application.destroy!
    head :no_content
  end

  def move
    if @application.update(move_params)
      render json: { data: application_payload(@application) }, status: :ok
    else
      render json: { errors: @application.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def set_application
    @application = current_user.applications.find(params[:id])
  end

  def application_params
    params.require(:application).permit(:company_id, :title, :status, :source, :salary_min, :salary_max,
                                        :currency, :remote, :location, :url, :applied_at, :position, tag_ids: [])
  end

  def move_params
    params.require(:application).permit(:status, :position)
  end

  def application_payload(application)
    application.as_json(
      only: %i[id user_id company_id title status source salary_min salary_max currency remote location url applied_at position created_at updated_at],
      include: {
        company: { only: %i[id name website location] },
        tags: { only: %i[id name color] }
      }
    )
  end
end

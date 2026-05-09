class CompaniesController < ApplicationController
  before_action :authenticate_user!
  before_action :set_company, only: %i[show update destroy]

  def index
    companies = current_user.companies.order(created_at: :desc)
    render json: { data: companies.as_json(only: %i[id name website location notes user_id created_at updated_at]) }, status: :ok
  end

  def show
    render json: { data: @company.as_json(only: %i[id name website location notes user_id created_at updated_at]) }, status: :ok
  end

  def create
    company = current_user.companies.new(company_params)
    if company.save
      render json: { data: company.as_json(only: %i[id name website location notes user_id created_at updated_at]) }, status: :created
    else
      render json: { errors: company.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @company.update(company_params)
      render json: { data: @company.as_json(only: %i[id name website location notes user_id created_at updated_at]) }, status: :ok
    else
      render json: { errors: @company.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @company.destroy!
    head :no_content
  end

  private

  def set_company
    @company = current_user.companies.find(params[:id])
  end

  def company_params
    params.require(:company).permit(:name, :website, :location, :notes)
  end
end

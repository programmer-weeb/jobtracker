class CompaniesController < ApplicationController
  before_action :authenticate_user!
  before_action :set_company, only: %i[show update destroy]

  def index
    companies = policy_scope(Company).order(created_at: :desc)
    authorize Company
    render json: { data: companies.as_json(only: %i[id name website location notes user_id created_at updated_at]) }, status: :ok
  end

  def show
    authorize @company
    render json: { data: @company.as_json(only: %i[id name website location notes user_id created_at updated_at]) }, status: :ok
  end

  def create
    company = current_user.companies.new(company_params)
    authorize company
    if company.save
      render json: { data: company.as_json(only: %i[id name website location notes user_id created_at updated_at]) }, status: :created
    else
      render json: { errors: company.errors.full_messages }, status: :unprocessable_content
    end
  end

  def update
    authorize @company
    if @company.update(company_params)
      render json: { data: @company.as_json(only: %i[id name website location notes user_id created_at updated_at]) }, status: :ok
    else
      render json: { errors: @company.errors.full_messages }, status: :unprocessable_content
    end
  end

  def destroy
    authorize @company
    @company.destroy!
    head :no_content
  end

  private

  def set_company
    @company = policy_scope(Company).find(params[:id])
  end

  def company_params
    params.require(:company).permit(:name, :website, :location, :notes)
  end
end

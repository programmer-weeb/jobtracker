class TagsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_tag, only: :destroy

  def index
    tags = current_user.tags.order(:name)
    render json: { data: tags.as_json(only: %i[id name color user_id created_at updated_at]) }, status: :ok
  end

  def create
    tag = current_user.tags.new(tag_params)
    if tag.save
      render json: { data: tag.as_json(only: %i[id name color user_id created_at updated_at]) }, status: :created
    else
      render json: { errors: tag.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @tag.destroy!
    head :no_content
  end

  private

  def set_tag
    @tag = current_user.tags.find(params[:id])
  end

  def tag_params
    params.require(:tag).permit(:name, :color)
  end
end

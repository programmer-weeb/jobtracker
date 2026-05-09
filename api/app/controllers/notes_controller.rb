class NotesController < ApplicationController
  before_action :authenticate_user!

  def create
    application = current_user.applications.find(params[:application_id])
    note = application.notes.new(note_params)

    if note.save
      render json: { data: note.as_json(only: %i[id application_id body created_at updated_at]) }, status: :created
    else
      render json: { errors: note.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    note = Note.joins(:application).where(applications: { user_id: current_user.id }).find(params[:id])
    note.destroy!
    head :no_content
  end

  private

  def note_params
    params.require(:note).permit(:body)
  end
end

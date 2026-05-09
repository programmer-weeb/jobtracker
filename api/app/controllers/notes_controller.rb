class NotesController < ApplicationController
  before_action :authenticate_user!

  def create
    application = policy_scope(Application).find(params[:application_id])
    authorize application, :show?
    note = application.notes.new(note_params)
    authorize note

    if note.save
      render json: { data: note.as_json(only: %i[id application_id body created_at updated_at]) }, status: :created
    else
      render json: { errors: note.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    note = policy_scope(Note).find(params[:id])
    authorize note
    note.destroy!
    head :no_content
  end

  private

  def note_params
    params.require(:note).permit(:body)
  end
end

class NotePolicy < ApplicationPolicyBase
  class Scope < Scope
    def resolve
      scope.joins(:application).where(applications: { user_id: user.id })
    end
  end

  def create?
    owner?
  end

  def destroy?
    owner?
  end

  private

  def owner?
    user.present? && record.application.user_id == user.id
  end
end

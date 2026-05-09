class CompanyPolicy < ApplicationPolicyBase
  class Scope < Scope
    def resolve
      scope.where(user_id: user.id)
    end
  end

  def index?
    user.present?
  end

  def show?
    owner?
  end

  def create?
    user.present? && record.user_id == user.id
  end

  def update?
    owner?
  end

  def destroy?
    owner?
  end

  private

  def owner?
    user.present? && record.user_id == user.id
  end
end

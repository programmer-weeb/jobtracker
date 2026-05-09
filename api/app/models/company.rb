class Company < ApplicationRecord
  belongs_to :user
  has_many :applications, dependent: :destroy

  validates :name, presence: true, uniqueness: { scope: :user_id }
end

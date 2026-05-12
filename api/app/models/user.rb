class User < ApplicationRecord
  include Devise::JWT::RevocationStrategies::JTIMatcher

  devise :database_authenticatable, :registerable, :validatable,
         :jwt_authenticatable, jwt_revocation_strategy: self

  has_many :companies, dependent: :destroy
  has_many :applications, dependent: :destroy
  has_many :tags, dependent: :destroy

  validates :name, presence: true

  before_create :set_jti
  after_create_commit :send_welcome_email_later

  private

  def set_jti
    self.jti ||= SecureRandom.uuid
  end

  def send_welcome_email_later
    WelcomeEmailJob.perform_later(self)
  end
end

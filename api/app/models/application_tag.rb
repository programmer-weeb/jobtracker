class ApplicationTag < ApplicationRecord
  belongs_to :application, touch: true
  belongs_to :tag

  validates :application_id, uniqueness: { scope: :tag_id }
end

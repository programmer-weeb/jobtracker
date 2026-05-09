class CreateEvents < ActiveRecord::Migration[8.1]
  def change
    create_table :events do |t|
      t.references :application, null: false, foreign_key: true
      t.integer :kind, null: false, default: 0
      t.jsonb :payload, null: false, default: {}

      t.timestamps
    end
  end
end

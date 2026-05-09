class CreateApplications < ActiveRecord::Migration[8.1]
  def change
    create_table :applications do |t|
      t.references :user, null: false, foreign_key: true
      t.references :company, null: false, foreign_key: true
      t.string :title, null: false
      t.integer :status, null: false, default: 0
      t.string :source
      t.integer :salary_min
      t.integer :salary_max
      t.string :currency
      t.boolean :remote, null: false, default: false
      t.string :location
      t.string :url
      t.datetime :applied_at
      t.integer :position, null: false, default: 0

      t.timestamps
    end

    add_index :applications, [:user_id, :status]
    add_index :applications, [:status, :position]
  end
end

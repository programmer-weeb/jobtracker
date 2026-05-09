class CreateCompanies < ActiveRecord::Migration[8.1]
  def change
    create_table :companies do |t|
      t.references :user, null: false, foreign_key: true
      t.string :name, null: false
      t.string :website
      t.string :location
      t.text :notes

      t.timestamps
    end

    add_index :companies, [:user_id, :name], unique: true
  end
end

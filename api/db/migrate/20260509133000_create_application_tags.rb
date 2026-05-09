class CreateApplicationTags < ActiveRecord::Migration[8.1]
  def change
    create_table :application_tags do |t|
      t.references :application, null: false, foreign_key: true
      t.references :tag, null: false, foreign_key: true

      t.timestamps
    end

    add_index :application_tags, [:application_id, :tag_id], unique: true
  end
end

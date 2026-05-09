# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_05_09_133000) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "application_tags", force: :cascade do |t|
    t.bigint "application_id", null: false
    t.datetime "created_at", null: false
    t.bigint "tag_id", null: false
    t.datetime "updated_at", null: false
    t.index ["application_id", "tag_id"], name: "index_application_tags_on_application_id_and_tag_id", unique: true
    t.index ["application_id"], name: "index_application_tags_on_application_id"
    t.index ["tag_id"], name: "index_application_tags_on_tag_id"
  end

  create_table "applications", force: :cascade do |t|
    t.datetime "applied_at"
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.string "currency"
    t.string "location"
    t.integer "position", default: 0, null: false
    t.boolean "remote", default: false, null: false
    t.integer "salary_max"
    t.integer "salary_min"
    t.string "source"
    t.integer "status", default: 0, null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.string "url"
    t.bigint "user_id", null: false
    t.index ["company_id"], name: "index_applications_on_company_id"
    t.index ["status", "position"], name: "index_applications_on_status_and_position"
    t.index ["user_id", "status"], name: "index_applications_on_user_id_and_status"
    t.index ["user_id"], name: "index_applications_on_user_id"
  end

  create_table "companies", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "location"
    t.string "name", null: false
    t.text "notes"
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.string "website"
    t.index ["user_id", "name"], name: "index_companies_on_user_id_and_name", unique: true
    t.index ["user_id"], name: "index_companies_on_user_id"
  end

  create_table "events", force: :cascade do |t|
    t.bigint "application_id", null: false
    t.datetime "created_at", null: false
    t.integer "kind", default: 0, null: false
    t.jsonb "payload", default: {}, null: false
    t.datetime "updated_at", null: false
    t.index ["application_id"], name: "index_events_on_application_id"
  end

  create_table "notes", force: :cascade do |t|
    t.bigint "application_id", null: false
    t.text "body", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["application_id"], name: "index_notes_on_application_id"
  end

  create_table "tags", force: :cascade do |t|
    t.string "color", null: false
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["user_id", "name"], name: "index_tags_on_user_id_and_name", unique: true
    t.index ["user_id"], name: "index_tags_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "jti", null: false
    t.string "name"
    t.datetime "remember_created_at"
    t.datetime "reset_password_sent_at"
    t.string "reset_password_token"
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["jti"], name: "index_users_on_jti", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  add_foreign_key "application_tags", "applications"
  add_foreign_key "application_tags", "tags"
  add_foreign_key "applications", "companies"
  add_foreign_key "applications", "users"
  add_foreign_key "companies", "users"
  add_foreign_key "events", "applications"
  add_foreign_key "notes", "applications"
  add_foreign_key "tags", "users"
end

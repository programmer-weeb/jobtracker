module DemoSeed
  module_function

  def run
    srand(20_260_509)

    ActiveRecord::Base.transaction do
      now = Time.zone.now
      puts "Seeding deterministic demo data..."

      seed_users = [
        { name: "Demo Hunter", email: "demo@example.com", password: "password123" },
        { name: "Scoped Recruiter", email: "scoped@example.com", password: "password123" }
      ]

      users = seed_users.map do |attrs|
        user = User.find_or_initialize_by(email: attrs[:email])
        user.update!(attrs)
        user
      end

      users.each do |user|
        user.applications.destroy_all
        user.tags.destroy_all
        user.companies.destroy_all
      end

      demo_user = users.find { |u| u.email == "demo@example.com" }
      scoped_user = users.find { |u| u.email == "scoped@example.com" }

      locations = [
        "Remote", "Cairo", "Dubai", "Berlin", "London", "Amsterdam",
        "Toronto", "New York", "San Francisco", "Austin", "Riyadh", "Singapore"
      ]
      sources = [
        "LinkedIn", "Wellfound", "Company Careers", "Referral", "Indeed",
        "Hacker News", "Otta", "Remote OK", "Built In", "Recruiter Email"
      ]
      titles = [
        "Rails Engineer", "Backend Engineer", "Fullstack Developer", "React Developer",
        "Platform Engineer", "API Engineer", "Product Engineer", "Senior Software Engineer",
        "Staff Backend Engineer", "DevOps Engineer", "Engineering Lead",
        "Senior Rails Engineer", "Frontend Engineer", "Principal Engineer",
        "Site Reliability Engineer", "Software Engineer II", "Data Platform Engineer",
        "Infrastructure Engineer", "Growth Engineer", "Integration Engineer"
      ]
      note_templates = [
        "Recruiter intro call went well. Team asks for API design depth and ownership stories.",
        "Interview scheduled next Tuesday, 10:30 AM. Need to confirm timezone with coordinator.",
        "Take-home received. Estimated effort 4-6 hours; plan to submit by Friday evening.",
        "Compensation seems below market. Target closer to upper band before final round.",
        "Sent follow-up message after onsite. Waiting for panel feedback.",
        "Referral from former teammate. Mentioned migration work and scaling PostgreSQL.",
        "Rejection note cited mismatch on system design expectations.",
        "Hiring manager emphasized product mindset and cross-functional communication.",
        "Need portfolio examples ready for frontend architecture questions.",
        "Role might require occasional relocation travel; clarify policy in next call.",
        "Candidate pipeline moving fast. Prioritize prep for behavioral + architecture loop.",
        "Added reminders for thank-you email and status check in 5 business days."
      ]
      company_notes = [
        "Strong engineering blog presence and transparent interview process.",
        "Comp package includes bonus; ask about equity refresh policy.",
        "Known for fast shipping culture, occasional evening collaboration overlap.",
        "Good fit for backend scope; product domain appears stable.",
        "Team distributed across Europe and MENA with async communication norms."
      ]

      demo_company_names = [
        "Nimbus Labs", "Atlas Fintech", "Helio Health", "Orchid Systems", "Blue Cedar Tech",
        "SummitFlow", "VectorPulse", "Granite Cloud", "Northstar Data", "Crescent Pay",
        "BrightPath AI", "Delta Harbor", "Praxis Health", "ForgeStack", "TerraBridge",
        "PixelFoundry", "Quantum Ledger", "Everfield", "Mosaic Commerce", "Apex Signals",
        "ClarityOps", "Saffron Digital", "Maple Analytics", "Ironwood Platform", "Nova Freight",
        "Coral Metrics", "Lighthouse Dev", "Monarch Security", "Zenith Robotics", "Cobalt Labs",
        "Harborline", "Ember Finance", "Acorn Mobility", "PulseWave", "Riverstone Software",
        "CloudHarbor", "BeaconNest", "DriftScale", "OriginStack", "Silverline Systems"
      ]

      demo_tag_data = [
        ["Remote", "#2563EB"], ["Hybrid", "#0EA5E9"], ["Rails", "#BE123C"], ["React", "#2563EB"],
        ["TypeScript", "#1D4ED8"], ["Backend", "#475569"], ["Frontend", "#7C3AED"],
        ["Fullstack", "#0F766E"], ["Fintech", "#0C4A6E"], ["Healthtech", "#166534"],
        ["Startup", "#EA580C"], ["Enterprise", "#334155"], ["Visa", "#9333EA"],
        ["High Salary", "#15803D"], ["Referral", "#B45309"], ["Urgent", "#DC2626"],
        ["Dream Role", "#C026D3"], ["Follow Up", "#0369A1"], ["Onsite", "#4F46E5"],
        ["Leadership", "#7E22CE"]
      ]

      demo_companies = build_companies_for(
        user: demo_user,
        names: demo_company_names,
        locations: locations,
        note_pool: company_notes
      )
      demo_tags = build_tags_for(user: demo_user, tag_data: demo_tag_data)

      demo_status_targets = {
        "wishlist" => 30,
        "applied" => 35,
        "interview" => 30,
        "offer" => 8,
        "rejected" => 35,
        "archived" => 20
      }

      demo_status_targets.each do |status, count|
        count.times do |idx|
          app = create_application(
            user: demo_user,
            company: demo_companies.sample,
            status: status,
            position: idx * 1024,
            title: titles.sample,
            source: sources.sample,
            location: locations.sample,
            currencies: %w[USD EUR GBP AED EGP],
            created_window_start: now - 120.days
          )
          assign_tags(application: app, tags: demo_tags)
          create_notes_and_events_for(application: app, status: status, note_templates: note_templates)
        end
      end

      scoped_company_names = [
        "ScopeWorks", "Pioneer Grid", "Halo Network", "Dockyard Labs",
        "Mint Cascade", "Fjord Systems", "Branchline", "OrbitCraft"
      ]
      scoped_tag_data = [
        ["Remote", "#2563EB"], ["Backend", "#475569"], ["Referral", "#B45309"],
        ["Urgent", "#DC2626"], ["Follow Up", "#0369A1"], ["Contract", "#4F46E5"]
      ]

      scoped_companies = build_companies_for(
        user: scoped_user,
        names: scoped_company_names,
        locations: locations.rotate(3),
        note_pool: company_notes
      )
      scoped_tags = build_tags_for(user: scoped_user, tag_data: scoped_tag_data)

      scoped_status_targets = {
        "wishlist" => 4,
        "applied" => 6,
        "interview" => 5,
        "offer" => 2,
        "rejected" => 5,
        "archived" => 2
      }

      scoped_status_targets.each do |status, count|
        count.times do |idx|
          app = create_application(
            user: scoped_user,
            company: scoped_companies.sample,
            status: status,
            position: idx * 1024,
            title: titles.sample,
            source: sources.sample,
            location: locations.sample,
            currencies: %w[USD EUR GBP],
            created_window_start: now - 90.days
          )
          assign_tags(application: app, tags: scoped_tags)
          create_notes_and_events_for(application: app, status: status, note_templates: note_templates)
        end
      end

      puts "Seed complete."
      puts({
        users_seeded: users.count,
        companies: Company.where(user_id: users.map(&:id)).count,
        tags: Tag.where(user_id: users.map(&:id)).count,
        applications: Application.where(user_id: users.map(&:id)).count,
        notes: Note.joins(application: :user).where(applications: { user_id: users.map(&:id) }).count,
        events: Event.joins(application: :user).where(applications: { user_id: users.map(&:id) }).count
      }.inspect)
      puts "Demo login: demo@example.com / password123"
      puts "Scoped login: scoped@example.com / password123"
    end
  end

  def slugify(text)
    text.downcase.gsub(/[^a-z0-9]+/, "-").gsub(/\A-+|-+\z/, "")
  end

  def random_time_between(start_time, end_time)
    start_ts = start_time.to_i
    end_ts = end_time.to_i
    Time.zone.at(rand(start_ts..end_ts))
  end

  def random_salary(currency)
    return [nil, nil] if rand < 0.30

    ranges = {
      "USD" => [70_000, 220_000],
      "EUR" => [50_000, 150_000],
      "GBP" => [45_000, 140_000],
      "AED" => [140_000, 520_000],
      "EGP" => [280_000, 1_400_000]
    }
    min_floor, max_ceil = ranges.fetch(currency)
    salary_min = rand(min_floor..(max_ceil - 15_000))
    salary_max = salary_min + rand(10_000..60_000)
    [salary_min, [salary_max, max_ceil].min]
  end

  def build_companies_for(user:, names:, locations:, note_pool:)
    companies = []

    names.each_with_index do |name, idx|
      domain = "#{slugify(name)}.com"
      company = user.companies.create!(
        name: name,
        website: "https://www.#{domain}",
        location: locations[idx % locations.length],
        notes: note_pool[idx % note_pool.length]
      )
      companies << company
    end

    companies
  end

  def build_tags_for(user:, tag_data:)
    tag_data.map do |name, color|
      user.tags.create!(name: name, color: color)
    end
  end

  def create_application(user:, company:, status:, position:, title:, source:, location:, currencies:, created_window_start:)
    currency = currencies.sample
    salary_min, salary_max = random_salary(currency)
    created_at = random_time_between(created_window_start, Time.zone.now - 2.hours)

    applied_at =
      if status == "wishlist"
        nil
      elsif rand < 0.88
        random_time_between(created_at + 1.hour, Time.zone.now)
      end

    url_slug = slugify("#{title}-#{company.name}")
    url = if rand < 0.12
      "https://careers.example.com/jobs/#{url_slug}"
    else
      "https://careers.#{slugify(company.name)}.com/jobs/#{url_slug}"
    end

    user.applications.create!(
      company: company,
      title: title,
      status: status,
      source: source,
      salary_min: salary_min,
      salary_max: salary_max,
      currency: currency,
      remote: [true, false].sample,
      location: location,
      url: url,
      applied_at: applied_at,
      position: position,
      created_at: created_at,
      updated_at: created_at
    )
  end

  def assign_tags(application:, tags:)
    picked = tags.sample(rand(0..5))
    picked.each { |tag| application.application_tags.create!(tag: tag) }
  end

  def create_notes_and_events_for(application:, status:, note_templates:)
    now = Time.zone.now
    base_time = application.created_at + 15.minutes
    note_target =
      case status
      when "interview", "offer"
        rand(2..5)
      when "applied", "rejected"
        rand < 0.75 ? rand(1..3) : 0
      when "wishlist"
        rand < 0.40 ? 1 : 0
      else
        rand < 0.55 ? rand(1..2) : 0
      end

    status_from =
      case status
      when "wishlist" then "wishlist"
      when "applied" then "wishlist"
      when "interview" then "applied"
      when "offer" then "interview"
      when "rejected" then ["applied", "interview"].sample
      when "archived" then ["rejected", "offer", "applied"].sample
      else "wishlist"
      end

    application.events.create!(
      kind: :status_changed,
      payload: { from: status_from, to: status },
      created_at: [application.created_at + 10.minutes, now].min,
      updated_at: [application.created_at + 10.minutes, now].min
    )

    notes = []
    note_target.times do |idx|
      created_at = [base_time + idx.hours + rand(5..45).minutes, now].min
      note = application.notes.create!(
        body: note_templates.sample,
        created_at: created_at,
        updated_at: created_at
      )
      notes << note
    end

    notes.each do |note|
      next unless rand < 0.60

      created_at = [note.created_at + 2.minutes, now].min
      application.events.create!(
        kind: :note_added,
        payload: {
          note_id: note.id,
          preview: note.body[0, 90]
        },
        created_at: created_at,
        updated_at: created_at
      )
    end

    if %w[applied interview offer].include?(status) && rand < 0.28
      reminder_time = [application.created_at + rand(2..15).days, now].min
      application.events.create!(
        kind: :reminder_sent,
        payload: { channel: "email", reason: "follow_up" },
        created_at: reminder_time,
        updated_at: reminder_time
      )
    end
  end
end

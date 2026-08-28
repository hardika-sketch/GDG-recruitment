export const societies = [
  {
    id: "gdg",
    name: "Google Developer Group",
    category: "Technical",
    tagline: "Code. Build. Innovate.",
    icon: "code",
    description: "Google Developer Group (GDG) is the flagship technical society on campus dedicated to coding, technology, and AI/ML. We build real-world projects using Google technologies — from Android and Flutter to TensorFlow and Cloud. Our members participate in hackathons, contribute to open-source, host tech talks by industry engineers, and organize the campus's largest annual coding fest. Whether you're into web dev, machine learning research, or competitive programming, GDG is your launchpad.",
    criteria: "Proficiency in at least one programming language (Python, JavaScript, C++, Java, etc.). Demonstrate problem-solving ability through a live coding challenge. Bonus points for open-source contributions, published projects, or prior hackathon participation. Passion for continuous learning is non-negotiable.",
    roles: [
      "Full Stack Developer",
      "AI/ML Research Lead",
      "Cloud & DevOps Engineer",
      "Technical Content Writer",
      "Community Manager"
    ],
    customFields: [
      {
        id: "languages",
        label: "Programming Languages",
        type: "checkbox-group",
        options: ["Python", "JavaScript/TypeScript", "C++", "Java", "Go", "Rust", "Swift/Kotlin"],
        required: true
      },
      {
        id: "github",
        label: "GitHub / Portfolio Link",
        type: "url",
        placeholder: "https://github.com/username",
        required: true
      },
      {
        id: "contributions",
        label: "Prior Open Source or Hackathon Experience",
        type: "radio-group",
        options: ["Yes", "No"],
        required: true
      }
    ]
  },
  {
    id: "crosslinks",
    name: "Crosslinks",
    category: "Media",
    tagline: "Amplify voices. Shape narratives.",
    icon: "megaphone",
    description: "Crosslinks is the campus media, public relations, and communications powerhouse. We manage institutional coverage, run social media campaigns, produce video documentaries, write press releases, and host talk shows. From live-tweeting campus events to producing polished editorial content, we are the storytellers of the institution. If you have an eye for news, a voice for podcasting, or a talent for strategic communications — Crosslinks is where you belong.",
    criteria: "Strong written and verbal communication skills. Submit a portfolio piece — an article, video script, social media campaign mock-up, or PR plan. Candidates are evaluated on clarity of thought, creativity, and media literacy. Prior experience with content creation tools (Canva, Premiere Pro, WordPress) is a plus.",
    roles: [
      "Content Strategist",
      "Video Producer & Editor",
      "Social Media Manager",
      "PR & Outreach Coordinator",
      "Podcast Host"
    ],
    customFields: [
      {
        id: "portfolioLink",
        label: "Portfolio / Sample Work Link",
        type: "url",
        placeholder: "e.g. Google Drive link or Behance/Medium",
        required: true
      },
      {
        id: "pieceType",
        label: "Type of Portfolio Piece Submitted",
        type: "select",
        options: ["Article / Writing Sample", "Video Script / Storyboard", "Social Media Campaign Mock-up", "PR / Outreach Plan", "Other"],
        required: true
      },
      {
        id: "tools",
        label: "Experienced Content Creation Tools",
        type: "checkbox-group",
        options: ["Canva", "Adobe Premiere Pro", "WordPress", "Adobe Photoshop / Illustrator", "Figma", "DaVinci Resolve", "Audacity / Audition"],
        required: false
      }
    ]
  },
  {
    id: "ares",
    name: "ARES",
    category: "Technical",
    tagline: "Engineer the impossible.",
    icon: "cpu",
    description: "ARES (Advanced Robotics & Engineering Society) is where hardware meets software. We design autonomous rovers, build drone systems, construct robotic arms, and compete in national-level robotics championships. Our workshop is a playground of 3D printers, soldering stations, microcontrollers, and sensor arrays. ARES members collaborate across mechanical, electrical, and software engineering disciplines to push the boundaries of what campus-built machines can achieve.",
    criteria: "Interest in embedded systems (Arduino, Raspberry Pi, ESP32), CAD modeling (SolidWorks, Fusion 360), or ROS. Candidates must demonstrate hands-on aptitude through a practical task involving circuit assembly or basic programming. Mechanical design experience and participation in tech competitions are valued.",
    roles: [
      "Embedded Systems Engineer",
      "Mechanical Design Lead",
      "Drone Pilot & Systems Architect",
      "Software Integration Developer",
      "Operations & Sponsorship Head"
    ],
    customFields: [
      {
        id: "domain",
        label: "Primary Domain of Interest",
        type: "select",
        options: ["Embedded Systems (Arduino/Pi)", "CAD Modeling (SolidWorks/Fusion 360)", "Robotics Operating System (ROS)", "Hardware / Circuit Assembly"],
        required: true
      },
      {
        id: "hardwareExp",
        label: "Describe your hands-on hardware/electronics projects",
        type: "textarea",
        placeholder: "Mention sensors, microcontrollers, CAD models or mechanical assemblies you have worked on...",
        required: true
      }
    ]
  },
  {
    id: "junoon",
    name: "Junoon",
    category: "Creative",
    tagline: "Frame the world, one click at a time.",
    icon: "camera",
    description: "Junoon is the official photography society — a collective of visual storytellers who capture campus life through lenses. From street photography and portraits to long-exposure night shots and event coverage, we document moments that define the college experience. We host photo walks, editing masterclasses, darkroom workshops, and an annual photography exhibition. Junoon members are the visual memory of the institution.",
    criteria: "Submit a portfolio of 5-10 original photographs showcasing range (portraits, landscape, street, macro, etc.). Candidates are evaluated on composition, storytelling ability, and technical understanding of exposure, lighting, and post-processing. Knowledge of Lightroom or Photoshop is preferred. DSLR ownership is not mandatory — phone photography portfolios are welcome.",
    roles: [
      "Lead Photographer",
      "Photo Editor & Retoucher",
      "Event Coverage Coordinator",
      "Exhibition Curator",
      "Social Media Visual Lead"
    ],
    customFields: [
      {
        id: "photographyLink",
        label: "Link to Photography Portfolio",
        type: "url",
        placeholder: "Google Drive, Instagram, or Flickr link",
        required: true
      },
      {
        id: "primaryDevice",
        label: "Primary Device for Photography",
        type: "select",
        options: ["DSLR / Mirrorless Camera", "Smartphone Camera", "Film Camera / Analog", "Other"],
        required: true
      },
      {
        id: "genres",
        label: "Preferred Genres of Photography",
        type: "checkbox-group",
        options: ["Portraits", "Landscape / Nature", "Street / Candid", "Macro", "Event Coverage", "Wildlife"],
        required: true
      },
      {
        id: "software",
        label: "Editing Software Proficiency",
        type: "checkbox-group",
        options: ["Adobe Lightroom", "Adobe Photoshop", "Mobile Apps (Snapseed / VSCO / Lightroom Mobile)", "None / Shoot RAW"],
        required: false
      }
    ]
  },
  {
    id: "tds",
    name: "TDS",
    category: "Technical",
    tagline: "Think. Debug. Solve.",
    icon: "terminal",
    description: "TDS (The Debug Society) is the competitive programming and data structures & algorithms society. We live and breathe problem-solving — from Codeforces rounds and LeetCode contests to ICPC regionals. Our weekly practice sessions cover graph theory, dynamic programming, number theory, and advanced data structures. TDS members consistently rank among the top competitive programmers in inter-college competitions and placement coding rounds.",
    criteria: "Solve a timed competitive programming problem set (3-5 problems of varying difficulty). Candidates must demonstrate strong logical reasoning and algorithmic thinking. Familiarity with at least one CP language (C++, Java, Python) and basic DSA concepts (arrays, sorting, recursion, trees) is expected. Codeforces / LeetCode / CodeChef ratings are considered.",
    roles: [
      "Problem Setter",
      "Contest Coordinator",
      "CP Mentor & Trainer",
      "Editorial Writer",
      "Platform & Infrastructure Lead"
    ],
    customFields: [
      {
        id: "cpLanguage",
        label: "Preferred CP Language",
        type: "select",
        options: ["C++", "Java", "Python", "Other"],
        required: true
      },
      {
        id: "codeforces",
        label: "Codeforces Username / Profile Link",
        type: "text",
        placeholder: "e.g. tourist (or N/A)",
        required: true
      },
      {
        id: "leetcode",
        label: "LeetCode / CodeChef Profile Link",
        type: "text",
        placeholder: "e.g. leetcode.com/username (or N/A)",
        required: true
      }
    ]
  },
  {
    id: "intaglios",
    name: "Intaglios",
    category: "Creative",
    tagline: "Design is intelligence made visible.",
    icon: "palette",
    description: "Intaglios is the design, UI/UX, and graphics society — where aesthetics meet functionality. We create brand identities, design event posters, build UI prototypes, and run design sprints. Our members work across Figma, Adobe Creative Suite, Blender, and motion graphics tools to produce visual experiences that are both beautiful and purposeful. From campus fest branding to app interface design, Intaglios sets the visual standard.",
    criteria: "Submit a design portfolio showcasing 3-5 works (posters, UI mockups, logos, illustrations, or motion graphics). Candidates are evaluated on visual hierarchy, typography, color theory, and creative originality. Proficiency in Figma, Illustrator, or Photoshop is expected. A short live design challenge may be conducted during recruitment.",
    roles: [
      "UI/UX Designer",
      "Graphic Designer",
      "Motion Graphics Artist",
      "Brand Identity Lead",
      "Design System Architect"
    ],
    customFields: [
      {
        id: "designPortfolio",
        label: "Design Portfolio Link",
        type: "url",
        placeholder: "Behance, Dribbble, Figma, Google Drive, etc.",
        required: true
      },
      {
        id: "software",
        label: "Primary Design Software Used",
        type: "checkbox-group",
        options: ["Figma", "Adobe Illustrator", "Adobe Photoshop", "Blender", "Adobe After Effects", "Canva", "Other"],
        required: true
      },
      {
        id: "interests",
        label: "Areas of Design Interest",
        type: "checkbox-group",
        options: ["UI/UX Design", "Graphic / Poster Design", "Motion Graphics", "Branding & Identity", "3D Modeling & Rendering", "Illustration"],
        required: true
      }
    ]
  },
  {
    id: "ashwamedh",
    name: "Ashwamedh",
    category: "Cultural",
    tagline: "All the campus is a stage.",
    icon: "theater",
    description: "Ashwamedh is the theatre and dramatics society — the beating heart of campus performance art. We produce original street plays (Nukkad Natak), stage dramas, mono-acts, mime performances, and stand-up showcases. Our rehearsal room echoes with voice modulation exercises, improvisational games, and script readings. Ashwamedh represents the institution at national-level theatre festivals and is known for thought-provoking social commentary through performance.",
    criteria: "Auditions evaluate expression, voice modulation, body language, confidence, and stage presence through improvisation rounds and monologue delivery. For backstage roles, candidates must demonstrate skills in scriptwriting, direction, set design, lighting, or sound engineering. A passion for storytelling in any form is the most important criterion.",
    roles: [
      "Lead Actor / Performer",
      "Scriptwriter & Director",
      "Stage & Set Designer",
      "Sound & Lighting Technician",
      "Production Manager"
    ],
    customFields: [
      {
        id: "theatreRole",
        label: "Audition Category Preference",
        type: "select",
        options: ["On-Stage Performer / Actor", "Backstage / Production Crew", "Both On-Stage and Backstage"],
        required: true
      },
      {
        id: "backstageSkills",
        label: "Specific Backstage / Technical Skills (if interested)",
        type: "checkbox-group",
        options: ["Scriptwriting / Adapting", "Direction / Assist Direction", "Stage Design / Scenography", "Sound Design & Engineering", "Light Design & Console Operation", "Costume, Makeup & Styling", "Production Management / PR"],
        required: false
      },
      {
        id: "theatreExp",
        label: "Describe prior acting, writing, or backstage experience",
        type: "textarea",
        placeholder: "Mention school plays, street plays, voice-overs, public speaking, or set construction. If none, write 'None - eager to learn!'",
        required: true
      }
    ]
  },
  {
    id: "crescendo",
    name: "Crescendo",
    category: "Cultural",
    tagline: "Where rhythms meet souls.",
    icon: "music",
    description: "Crescendo is the music and singing society — a collective of vocalists, instrumentalists, and composers who fill the campus with melody. From Indian classical ragas and Bollywood medleys to rock anthems and indie originals, we cover the full spectrum. Our members perform at college fests, open-mic nights, unplugged sessions, and inter-college music battles. We also run instrument workshops and vocal training camps for beginners.",
    criteria: "Perform a 2-3 minute vocal or instrumental audition piece of your choice. Candidates are evaluated on pitch accuracy, rhythm, tonal quality, and stage comfort. Knowledge of music theory is appreciated but not mandatory. Ability to collaborate in a band or ensemble setting is highly valued. Composers and beatmakers are also welcome.",
    roles: [
      "Lead Vocalist",
      "Instrumentalist (Guitar/Keys/Drums)",
      "Music Composer & Arranger",
      "Sound Engineer",
      "Event & Gig Coordinator"
    ],
    customFields: [
      {
        id: "musicCategory",
        label: "Performance Category",
        type: "select",
        options: ["Vocalist (Indian Classical / Light Music / Western)", "Instrumentalist (Guitar / Keys / Drums / Violin, etc.)", "Music Composer / Beatmaker / Producer", "Sound Engineer / Live Sound Coordinator", "Other"],
        required: true
      },
      {
        id: "instrumentsDetails",
        label: "Instruments Played / Vocal Range",
        type: "text",
        placeholder: "e.g. Acoustic Guitar (3 years), Bass, or Soprano vocal range",
        required: true
      },
      {
        id: "performanceClip",
        label: "Link to Audio/Video Performance Clip",
        type: "url",
        placeholder: "Google Drive, YouTube, or SoundCloud link",
        required: true
      },
      {
        id: "theoryKnowledge",
        label: "Knowledge of Music Theory",
        type: "radio-group",
        options: ["None / Self-taught by ear", "Basic (read notes/chords)", "Intermediate (scales, keys, rhythm signatures)", "Advanced (formal classical training / sheets)"],
        required: true
      }
    ]
  },
  {
    id: "mirage",
    name: "Mirage",
    category: "Cultural",
    tagline: "Move. Express. Ignite.",
    icon: "zap",
    description: "Mirage is the western dance society — a high-energy crew of dancers who specialize in contemporary, hip-hop, popping, locking, waacking, and freestyle. From flash mobs in the campus courtyard to choreographed performances at national dance competitions, Mirage brings raw energy and artistic precision to every stage. We hold daily practice sessions, choreography workshops, and dance battles that push members to constantly evolve their craft.",
    criteria: "Auditions involve performing a prepared choreography or freestyle piece (1-2 minutes) in any western dance style. Candidates are judged on rhythm, body control, expression, musicality, and stage presence. Prior dance training is preferred but natural talent and willingness to train intensely are equally valued. Choreographers and crew managers are also recruited.",
    roles: [
      "Lead Choreographer",
      "Performance Captain",
      "Freestyle Battle Lead",
      "Costume & Visual Director",
      "Practice Session Coordinator"
    ],
    customFields: [
      {
        id: "danceStyles",
        label: "Dance Styles Experienced In",
        type: "checkbox-group",
        options: ["Hip-Hop / Urban", "Contemporary / Ballet", "Popping & Locking", "Waacking / Whacking", "Freestyle / Krump", "Bollywood & Folk", "Classical (Kathak/Bharatnatyam/etc.)", "Other"],
        required: true
      },
      {
        id: "auditionClip",
        label: "Link to Choreography/Freestyle Video Clip",
        type: "url",
        placeholder: "Google Drive, YouTube, Instagram Reels, or Dropbox link",
        required: true
      },
      {
        id: "crewExp",
        label: "Prior dance training or crew experience?",
        type: "radio-group",
        options: ["Yes", "No"],
        required: true
      }
    ]
  },
  {
    id: "canvas",
    name: "Canvas",
    category: "Creative",
    tagline: "Art speaks where words fail.",
    icon: "brush",
    description: "Canvas is the fine arts and visual art society — a sanctuary for painters, sketchers, sculptors, and mixed-media artists. We host life drawing sessions, mural painting projects, art exhibitions, and collaborative installations. Canvas members transform blank walls into campus landmarks and blank paper into gallery-worthy pieces. From charcoal sketches to oil on canvas, watercolor washes to digital painting — every medium finds a home here.",
    criteria: "Submit a portfolio of 5-8 original artworks across any medium (pencil, charcoal, watercolor, acrylic, digital, mixed media). Candidates are evaluated on technique, creativity, composition, and conceptual depth. A live sketching round may be conducted during recruitment. Willingness to participate in collaborative art projects and campus mural initiatives is expected.",
    roles: [
      "Lead Visual Artist",
      "Mural & Installation Coordinator",
      "Exhibition Curator",
      "Digital Art Specialist",
      "Workshop Facilitator"
    ],
    customFields: [
      {
        id: "artPortfolio",
        label: "Art Portfolio Link",
        type: "url",
        placeholder: "Google Drive, Instagram art page, ArtStation, Behance",
        required: true
      },
      {
        id: "mediums",
        label: "Preferred Art Mediums",
        type: "checkbox-group",
        options: ["Pencil / Charcoal Sketching", "Watercolor Painting", "Acrylic / Oil Painting", "Digital Art (Procreate/Photoshop)", "Sculptures & Clay Modelling", "Mixed Media", "Other"],
        required: true
      },
      {
        id: "muralProject",
        label: "Willingness to participate in campus mural projects?",
        type: "radio-group",
        options: ["Yes, highly interested", "Maybe / Depends on project", "No, prefer solo/canvas painting"],
        required: true
      }
    ]
  }
];

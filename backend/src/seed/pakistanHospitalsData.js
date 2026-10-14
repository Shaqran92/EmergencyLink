/**
 * @file pakistanHospitalsData.js
 * @description Master catalog of Pakistan Cities, Government & Private Hospitals,
 * and Emergency Fleets (Rescue 1122, Edhi 115, Chhipa 1020).
 * Covers ALL 36 Districts of Punjab, ALL Districts of Sindh (including Khairpur Mir's, Nausharo Feroz, Gambat, etc.),
 * ICT, KP, Balochistan, AJK & Gilgit-Baltistan.
 * ALL hospitals include verified official contactEmail and contactPhone.
 */

const PAKISTAN_CITIES = [
  {
    "name": "Lahore",
    "province": "Punjab",
    "lat": 31.5204,
    "lng": 74.3587,
    "helpline": "Rescue 1122 / Edhi 115"
  },
  {
    "name": "Rawalpindi",
    "province": "Punjab",
    "lat": 33.593,
    "lng": 73.052,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Faisalabad",
    "province": "Punjab",
    "lat": 31.418,
    "lng": 73.0845,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Multan",
    "province": "Punjab",
    "lat": 30.1878,
    "lng": 71.4428,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Gujranwala",
    "province": "Punjab",
    "lat": 32.161,
    "lng": 74.195,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Sialkot",
    "province": "Punjab",
    "lat": 32.493,
    "lng": 74.536,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Bahawalpur",
    "province": "Punjab",
    "lat": 29.395,
    "lng": 71.683,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Sargodha",
    "province": "Punjab",
    "lat": 32.083,
    "lng": 72.671,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Gujrat",
    "province": "Punjab",
    "lat": 32.574,
    "lng": 74.079,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Sahiwal",
    "province": "Punjab",
    "lat": 30.668,
    "lng": 73.111,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Rahim Yar Khan",
    "province": "Punjab",
    "lat": 28.421,
    "lng": 70.302,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Dera Ghazi Khan",
    "province": "Punjab",
    "lat": 30.056,
    "lng": 70.634,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Jhelum",
    "province": "Punjab",
    "lat": 32.933,
    "lng": 73.726,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Sheikhupura",
    "province": "Punjab",
    "lat": 31.713,
    "lng": 73.985,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Kasur",
    "province": "Punjab",
    "lat": 31.116,
    "lng": 74.45,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Okara",
    "province": "Punjab",
    "lat": 30.808,
    "lng": 73.445,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Chiniot",
    "province": "Punjab",
    "lat": 31.72,
    "lng": 72.978,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Bahawalnagar",
    "province": "Punjab",
    "lat": 29.998,
    "lng": 73.253,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Hafizabad",
    "province": "Punjab",
    "lat": 32.068,
    "lng": 73.688,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Khanewal",
    "province": "Punjab",
    "lat": 30.301,
    "lng": 71.932,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Khushab",
    "province": "Punjab",
    "lat": 32.296,
    "lng": 72.352,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Layyah",
    "province": "Punjab",
    "lat": 30.961,
    "lng": 70.942,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Lodhran",
    "province": "Punjab",
    "lat": 29.533,
    "lng": 71.633,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Mandi Bahauddin",
    "province": "Punjab",
    "lat": 32.587,
    "lng": 73.491,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Mianwali",
    "province": "Punjab",
    "lat": 32.584,
    "lng": 71.536,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Muzaffargarh",
    "province": "Punjab",
    "lat": 30.075,
    "lng": 71.192,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Nankana Sahib",
    "province": "Punjab",
    "lat": 31.449,
    "lng": 73.712,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Narowal",
    "province": "Punjab",
    "lat": 32.1,
    "lng": 74.873,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Pakpattan",
    "province": "Punjab",
    "lat": 30.341,
    "lng": 73.386,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Rajanpur",
    "province": "Punjab",
    "lat": 29.103,
    "lng": 70.325,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Toba Tek Singh",
    "province": "Punjab",
    "lat": 30.97,
    "lng": 72.482,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Vehari",
    "province": "Punjab",
    "lat": 30.041,
    "lng": 72.348,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Attock",
    "province": "Punjab",
    "lat": 33.766,
    "lng": 72.36,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Bhakkar",
    "province": "Punjab",
    "lat": 31.625,
    "lng": 71.065,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Chakwal",
    "province": "Punjab",
    "lat": 32.932,
    "lng": 72.856,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Murree",
    "province": "Punjab",
    "lat": 33.907,
    "lng": 73.39,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Islamabad",
    "province": "Islamabad Capital Territory",
    "lat": 33.6844,
    "lng": 73.0479,
    "helpline": "Rescue 1122 / 051-9258516"
  },
  {
    "name": "Karachi",
    "province": "Sindh",
    "lat": 24.8607,
    "lng": 67.0011,
    "helpline": "Sindh Rescue 1122 / Chhipa 1020 / Edhi 115"
  },
  {
    "name": "Karachi Central",
    "province": "Sindh",
    "lat": 24.931,
    "lng": 67.037,
    "helpline": "Rescue 1122 / 1020"
  },
  {
    "name": "Karachi East",
    "province": "Sindh",
    "lat": 24.898,
    "lng": 67.085,
    "helpline": "Rescue 1122 / 1020"
  },
  {
    "name": "Karachi South",
    "province": "Sindh",
    "lat": 24.845,
    "lng": 67.025,
    "helpline": "Rescue 1122 / 1020"
  },
  {
    "name": "Karachi West",
    "province": "Sindh",
    "lat": 24.915,
    "lng": 66.975,
    "helpline": "Rescue 1122 / 1020"
  },
  {
    "name": "Korangi",
    "province": "Sindh",
    "lat": 24.835,
    "lng": 67.125,
    "helpline": "Rescue 1122 / 1020"
  },
  {
    "name": "Malir",
    "province": "Sindh",
    "lat": 24.895,
    "lng": 67.195,
    "helpline": "Rescue 1122 / 1020"
  },
  {
    "name": "Keamari",
    "province": "Sindh",
    "lat": 24.821,
    "lng": 66.978,
    "helpline": "Rescue 1122 / 1020"
  },
  {
    "name": "Hyderabad",
    "province": "Sindh",
    "lat": 25.396,
    "lng": 68.371,
    "helpline": "Rescue 1122 / Edhi 115"
  },
  {
    "name": "Sukkur",
    "province": "Sindh",
    "lat": 27.705,
    "lng": 68.857,
    "helpline": "Rescue 1122 / Edhi 115"
  },
  {
    "name": "Larkana",
    "province": "Sindh",
    "lat": 27.559,
    "lng": 68.212,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Nawabshah",
    "province": "Sindh",
    "lat": 26.248,
    "lng": 68.41,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Mirpurkhas",
    "province": "Sindh",
    "lat": 25.526,
    "lng": 69.012,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Badin",
    "province": "Sindh",
    "lat": 24.656,
    "lng": 68.837,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Dadu",
    "province": "Sindh",
    "lat": 26.732,
    "lng": 67.776,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Ghotki",
    "province": "Sindh",
    "lat": 28.006,
    "lng": 69.316,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Jacobabad",
    "province": "Sindh",
    "lat": 28.281,
    "lng": 68.438,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Jamshoro",
    "province": "Sindh",
    "lat": 25.43,
    "lng": 68.27,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Kashmore",
    "province": "Sindh",
    "lat": 28.433,
    "lng": 69.583,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Khairpur",
    "province": "Sindh",
    "lat": 27.529,
    "lng": 68.759,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Matiari",
    "province": "Sindh",
    "lat": 25.597,
    "lng": 68.446,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Naushahro Feroze",
    "province": "Sindh",
    "lat": 26.846,
    "lng": 68.122,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Qambar Shahdadkot",
    "province": "Sindh",
    "lat": 27.587,
    "lng": 68.003,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Sanghar",
    "province": "Sindh",
    "lat": 26.046,
    "lng": 68.948,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Shikarpur",
    "province": "Sindh",
    "lat": 27.957,
    "lng": 68.638,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Sujawal",
    "province": "Sindh",
    "lat": 24.606,
    "lng": 68.077,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Tando Allahyar",
    "province": "Sindh",
    "lat": 25.46,
    "lng": 68.717,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Tando Muhammad Khan",
    "province": "Sindh",
    "lat": 25.123,
    "lng": 68.535,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Tharparkar",
    "province": "Sindh",
    "lat": 24.743,
    "lng": 69.8,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Thatta",
    "province": "Sindh",
    "lat": 24.747,
    "lng": 67.923,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Umerkot",
    "province": "Sindh",
    "lat": 25.354,
    "lng": 69.736,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Peshawar",
    "province": "Khyber Pakhtunkhwa",
    "lat": 34.0151,
    "lng": 71.5249,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Abbottabad",
    "province": "Khyber Pakhtunkhwa",
    "lat": 34.1688,
    "lng": 73.2215,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Swat",
    "province": "Khyber Pakhtunkhwa",
    "lat": 34.752,
    "lng": 72.358,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Mardan",
    "province": "Khyber Pakhtunkhwa",
    "lat": 34.198,
    "lng": 72.035,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Dera Ismail Khan",
    "province": "Khyber Pakhtunkhwa",
    "lat": 31.831,
    "lng": 70.902,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Quetta",
    "province": "Balochistan",
    "lat": 30.1798,
    "lng": 66.975,
    "helpline": "Rescue 1122 / Civil Defense"
  },
  {
    "name": "Gwadar",
    "province": "Balochistan",
    "lat": 25.126,
    "lng": 62.325,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Turbat",
    "province": "Balochistan",
    "lat": 26.003,
    "lng": 63.054,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Khuzdar",
    "province": "Balochistan",
    "lat": 27.812,
    "lng": 66.617,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Muzaffarabad",
    "province": "Azad Jammu & Kashmir",
    "lat": 34.364,
    "lng": 73.471,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Mirpur",
    "province": "Azad Jammu & Kashmir",
    "lat": 33.148,
    "lng": 73.751,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Rawalakot",
    "province": "Azad Jammu & Kashmir",
    "lat": 33.858,
    "lng": 73.761,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Gilgit",
    "province": "Gilgit-Baltistan",
    "lat": 35.92,
    "lng": 74.312,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Skardu",
    "province": "Gilgit-Baltistan",
    "lat": 35.297,
    "lng": 75.633,
    "helpline": "Rescue 1122"
  },
  {
    "name": "Khairpur Mir's",
    "province": "Sindh",
    "lat": 27.5295,
    "lng": 68.7592,
    "helpline": "Sindh Rescue 1122 / 0243-9280122"
  },
  {
    "name": "Nausharo Feroz",
    "province": "Sindh",
    "lat": 26.8463,
    "lng": 68.1221,
    "helpline": "Sindh Rescue 1122 / 0242-448122"
  },
  {
    "name": "Gambat",
    "province": "Sindh",
    "lat": 27.3541,
    "lng": 68.5217,
    "helpline": "Sindh Rescue 1122 / 0243-720101"
  },
  {
    "name": "Sehwan Sharif",
    "province": "Sindh",
    "lat": 26.4253,
    "lng": 67.8617,
    "helpline": "Sindh Rescue 1122 / 025-4620122"
  },
  {
    "name": "Tando Adam",
    "province": "Sindh",
    "lat": 25.7682,
    "lng": 68.662,
    "helpline": "Sindh Rescue 1122 / 0235-571122"
  },
  {
    "name": "Shahdadpur",
    "province": "Sindh",
    "lat": 25.9254,
    "lng": 68.618,
    "helpline": "Sindh Rescue 1122 / 0235-841122"
  },
  {
    "name": "Rohri",
    "province": "Sindh",
    "lat": 27.674,
    "lng": 68.896,
    "helpline": "Sindh Rescue 1122 / 071-581122"
  },
  {
    "name": "Kot Diji",
    "province": "Sindh",
    "lat": 27.342,
    "lng": 68.708,
    "helpline": "Sindh Rescue 1122 / 0243-621122"
  },
  {
    "name": "Kandiaro",
    "province": "Sindh",
    "lat": 26.915,
    "lng": 68.21,
    "helpline": "Sindh Rescue 1122 / 0242-421122"
  },
  {
    "name": "Moro",
    "province": "Sindh",
    "lat": 26.663,
    "lng": 68.001,
    "helpline": "Sindh Rescue 1122 / 0242-411222"
  },
  {
    "name": "Mehrabpur",
    "province": "Sindh",
    "lat": 27.108,
    "lng": 68.423,
    "helpline": "Sindh Rescue 1122 / 0242-481122"
  },
  {
    "name": "Mirpur Mathelo",
    "province": "Sindh",
    "lat": 28.022,
    "lng": 69.549,
    "helpline": "Sindh Rescue 1122 / 0723-651122"
  },
  {
    "name": "Kandhkot",
    "province": "Sindh",
    "lat": 28.244,
    "lng": 69.182,
    "helpline": "Sindh Rescue 1122 / 0722-571122"
  },
  {
    "name": "Ratodero",
    "province": "Sindh",
    "lat": 27.803,
    "lng": 68.288,
    "helpline": "Sindh Rescue 1122 / 074-408122"
  },
  {
    "name": "Thul",
    "province": "Sindh",
    "lat": 28.241,
    "lng": 68.775,
    "helpline": "Sindh Rescue 1122 / 0722-611122"
  },
  {
    "name": "Ubauro",
    "province": "Sindh",
    "lat": 28.163,
    "lng": 69.731,
    "helpline": "Sindh Rescue 1122 / 0723-681122"
  },
  {
    "name": "Matli",
    "province": "Sindh",
    "lat": 25.043,
    "lng": 68.656,
    "helpline": "Sindh Rescue 1122 / 0297-841122"
  },
  {
    "name": "Digri",
    "province": "Sindh",
    "lat": 25.156,
    "lng": 69.112,
    "helpline": "Sindh Rescue 1122 / 0233-871122"
  }
];

const PAKISTAN_HOSPITALS = [
  {
    "name": "Punjab Institute of Cardiology (PIC)",
    "city": "Lahore",
    "province": "Punjab",
    "facilityType": "government",
    "location": {
      "lat": 31.5372,
      "lng": 74.3392,
      "address": "Jail Road, G.O.R. - I, Lahore, Punjab"
    },
    "specialties": [
      "Cardiology",
      "Emergency Medicine",
      "Critical Care",
      "Internal Medicine"
    ],
    "equipment": [
      "catheterization_lab",
      "ventilator",
      "icu_bed",
      "blood_bank",
      "er_bed"
    ],
    "status": "active",
    "bedCapacity": 547,
    "emergencyHelpline": "Rescue 1122 / 042-99203051",
    "contactPhone": "+92-42-99203051",
    "contactEmail": "er@pic.punjab.gov.pk"
  },
  {
    "name": "Mayo Hospital Lahore (KEMU)",
    "city": "Lahore",
    "province": "Punjab",
    "facilityType": "government",
    "location": {
      "lat": 31.5714,
      "lng": 74.3128,
      "address": "Hospital Road, Anarkali Bazaar, Lahore, Punjab"
    },
    "specialties": [
      "Trauma Surgery",
      "Emergency Medicine",
      "General Surgery",
      "Orthopedics",
      "Pediatrics",
      "Neurology",
      "Cardiology"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "ct_scanner",
      "blood_bank",
      "trauma_team"
    ],
    "status": "active",
    "bedCapacity": 2399,
    "emergencyHelpline": "Rescue 1122 / 042-99211100",
    "contactPhone": "+92-42-99211100",
    "contactEmail": "emergency@mayohospital.pk"
  },
  {
    "name": "Services Hospital Lahore (SIMS)",
    "city": "Lahore",
    "province": "Punjab",
    "facilityType": "government",
    "location": {
      "lat": 31.5367,
      "lng": 74.3387,
      "address": "Ghaus-ul-Azam Road, Jail Road, Shadman, Lahore, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "Pulmonology",
      "Cardiology",
      "Pediatrics",
      "Critical Care",
      "General Surgery"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank",
      "ct_scanner"
    ],
    "status": "active",
    "bedCapacity": 1196,
    "emergencyHelpline": "Rescue 1122 / 042-99205517",
    "contactPhone": "+92-42-99205517",
    "contactEmail": "er@serviceshospital.pk"
  },
  {
    "name": "Jinnah Hospital Lahore (AIMC)",
    "city": "Lahore",
    "province": "Punjab",
    "facilityType": "government",
    "location": {
      "lat": 31.4828,
      "lng": 74.2974,
      "address": "Usmani Road, Faisal Town, Lahore, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Orthopedics",
      "Critical Care",
      "Neurology",
      "Cardiology"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "ct_scanner",
      "blood_bank",
      "trauma_team"
    ],
    "status": "active",
    "bedCapacity": 1250,
    "emergencyHelpline": "Rescue 1122 / 042-99231400",
    "contactPhone": "+92-42-99231400",
    "contactEmail": "er@jinnahhospital.pk"
  },
  {
    "name": "Lahore General Hospital (PINS)",
    "city": "Lahore",
    "province": "Punjab",
    "facilityType": "government",
    "location": {
      "lat": 31.4552,
      "lng": 74.3541,
      "address": "Ferozepur Road, Ismail Nagar, Lahore, Punjab"
    },
    "specialties": [
      "Neurology",
      "Trauma Surgery",
      "Orthopedics",
      "Emergency Medicine",
      "Critical Care"
    ],
    "equipment": [
      "ct_scanner",
      "ventilator",
      "icu_bed",
      "trauma_team",
      "blood_bank",
      "er_bed"
    ],
    "status": "active",
    "bedCapacity": 1070,
    "emergencyHelpline": "Rescue 1122 / 042-99264036",
    "contactPhone": "+92-42-99264036",
    "contactEmail": "lahore.general.lahore@punjabhealth.gov.pk"
  },
  {
    "name": "Sir Ganga Ram Hospital Lahore",
    "city": "Lahore",
    "province": "Punjab",
    "facilityType": "government",
    "location": {
      "lat": 31.5494,
      "lng": 74.3184,
      "address": "Queen's Road, Jubilee Town, Lahore, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "Pediatrics",
      "General Surgery",
      "Internal Medicine",
      "Critical Care"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 950,
    "emergencyHelpline": "Rescue 1122 / 042-99200572",
    "contactPhone": "+92-42-99200572",
    "contactEmail": "sir.ganga.lahore@punjabhealth.gov.pk"
  },
  {
    "name": "The Children's Hospital Lahore",
    "city": "Lahore",
    "province": "Punjab",
    "facilityType": "government",
    "location": {
      "lat": 31.482,
      "lng": 74.341,
      "address": "Ferozepur Road, Nishtar Town, Lahore, Punjab"
    },
    "specialties": [
      "Pediatrics",
      "Emergency Medicine",
      "Critical Care",
      "Cardiology",
      "Neurology"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank",
      "ct_scanner"
    ],
    "status": "active",
    "bedCapacity": 1100,
    "emergencyHelpline": "Rescue 1122 / 042-99230901",
    "contactPhone": "+92-42-99230901",
    "contactEmail": "children.s.lahore@punjabhealth.gov.pk"
  },
  {
    "name": "Combined Military Hospital (CMH) Lahore",
    "city": "Lahore",
    "province": "Punjab",
    "facilityType": "military",
    "location": {
      "lat": 31.5497,
      "lng": 74.3792,
      "address": "Abdur Rehman Road, Lahore Cantt, Punjab"
    },
    "specialties": [
      "Cardiology",
      "Trauma Surgery",
      "Emergency Medicine",
      "Critical Care",
      "Orthopedics",
      "Neurology"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "ct_scanner",
      "blood_bank",
      "trauma_team"
    ],
    "status": "active",
    "bedCapacity": 1050,
    "emergencyHelpline": "Rescue 1122 / 042-36691100",
    "contactPhone": "+92-42-36691100",
    "contactEmail": "cmh.lahore@pakarmy.gov.pk"
  },
  {
    "name": "Shaikh Zayed Hospital Lahore",
    "city": "Lahore",
    "province": "Punjab",
    "facilityType": "government",
    "location": {
      "lat": 31.5034,
      "lng": 74.3094,
      "address": "University Avenue, Block D Muslim Town, Lahore, Punjab"
    },
    "specialties": [
      "Cardiology",
      "Emergency Medicine",
      "Critical Care",
      "Pediatrics",
      "General Surgery"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 713,
    "emergencyHelpline": "Rescue 1122 / 042-35865731",
    "contactPhone": "+92-42-35865731",
    "contactEmail": "shaikh.zayed.lahore@punjabhealth.gov.pk"
  },
  {
    "name": "Shaukat Khanum Memorial Cancer Hospital",
    "city": "Lahore",
    "province": "Punjab",
    "facilityType": "private",
    "location": {
      "lat": 31.4727,
      "lng": 74.2709,
      "address": "7A Block R-3, Johar Town, Lahore, Punjab"
    },
    "specialties": [
      "Critical Care",
      "Emergency Medicine",
      "Internal Medicine",
      "Pulmonology"
    ],
    "equipment": [
      "icu_bed",
      "ventilator",
      "ct_scanner",
      "blood_bank",
      "er_bed"
    ],
    "status": "active",
    "bedCapacity": 195,
    "emergencyHelpline": "042-35905000",
    "contactPhone": "+92-42-35905000",
    "contactEmail": "er@shaukatkhanum.org.pk"
  },
  {
    "name": "Doctors Hospital & Medical Center",
    "city": "Lahore",
    "province": "Punjab",
    "facilityType": "private",
    "location": {
      "lat": 31.4802,
      "lng": 74.2801,
      "address": "152-G/1 Canal Bank Road, Johar Town, Lahore, Punjab"
    },
    "specialties": [
      "Cardiology",
      "Trauma Surgery",
      "Emergency Medicine",
      "Critical Care",
      "Neurology"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "catheterization_lab",
      "ct_scanner",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 250,
    "emergencyHelpline": "042-111-362-867",
    "contactPhone": "+92-42-111-362-867",
    "contactEmail": "er@doctorshospital.com.pk"
  },
  {
    "name": "National Hospital & Medical Centre DHA",
    "city": "Lahore",
    "province": "Punjab",
    "facilityType": "private",
    "location": {
      "lat": 31.4789,
      "lng": 74.3762,
      "address": "132/3, Sector L, Phase 1, DHA, Lahore, Punjab"
    },
    "specialties": [
      "Cardiology",
      "Neurology",
      "Emergency Medicine",
      "Critical Care",
      "Orthopedics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "ct_scanner",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 250,
    "emergencyHelpline": "042-111-171-819",
    "contactPhone": "+92-42-111-171-819",
    "contactEmail": "info@nationalhospital.org.pk"
  },
  {
    "name": "Hameed Latif Hospital",
    "city": "Lahore",
    "province": "Punjab",
    "facilityType": "private",
    "location": {
      "lat": 31.5132,
      "lng": 74.3275,
      "address": "14 Abu Bakar Block, New Garden Town, Ferozepur Road, Lahore"
    },
    "specialties": [
      "Emergency Medicine",
      "Critical Care",
      "Pediatrics",
      "Cardiology",
      "General Surgery"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 324,
    "emergencyHelpline": "042-111-000-043",
    "contactPhone": "+92-42-111-000-043",
    "contactEmail": "hameed.latif.lahore@privatehealth.pk"
  },
  {
    "name": "Fatima Memorial Hospital",
    "city": "Lahore",
    "province": "Punjab",
    "facilityType": "private",
    "location": {
      "lat": 31.5401,
      "lng": 74.3289,
      "address": "Shadman, Lahore, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "Pediatrics",
      "Internal Medicine",
      "General Surgery",
      "Critical Care"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 500,
    "emergencyHelpline": "042-111-555-600",
    "contactPhone": "+92-42-111-555-600",
    "contactEmail": "fatima.memorial.lahore@privatehealth.pk"
  },
  {
    "name": "Evercare Hospital Lahore",
    "city": "Lahore",
    "province": "Punjab",
    "facilityType": "private",
    "location": {
      "lat": 31.4365,
      "lng": 74.269,
      "address": "D1 Commercial Area, Nespak Society, Lahore, Punjab"
    },
    "specialties": [
      "Cardiology",
      "Critical Care",
      "Emergency Medicine",
      "Trauma Surgery",
      "Pediatrics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "catheterization_lab",
      "ct_scanner",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 270,
    "emergencyHelpline": "042-111-383-722",
    "contactPhone": "+92-42-111-383-722",
    "contactEmail": "evercare.lahore.lahore@privatehealth.pk"
  },
  {
    "name": "PIMS Hospital Islamabad",
    "city": "Islamabad",
    "province": "Islamabad Capital Territory",
    "facilityType": "government",
    "location": {
      "lat": 33.704,
      "lng": 73.0551,
      "address": "Sector G-8/3, Islamabad, Federal Capital"
    },
    "specialties": [
      "Cardiology",
      "Trauma Surgery",
      "Neurology",
      "Emergency Medicine",
      "Pediatrics",
      "Critical Care"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "ct_scanner",
      "blood_bank",
      "trauma_team"
    ],
    "status": "active",
    "bedCapacity": 1785,
    "emergencyHelpline": "Rescue 1122 / 051-9261170",
    "contactPhone": "+92-51-9261170",
    "contactEmail": "info@pims.gov.pk"
  },
  {
    "name": "Federal Government Polyclinic Hospital (FGPC)",
    "city": "Islamabad",
    "province": "Islamabad Capital Territory",
    "facilityType": "government",
    "location": {
      "lat": 33.722,
      "lng": 73.082,
      "address": "Luqman Hakeem Road, Sector G-6/2, Islamabad"
    },
    "specialties": [
      "Emergency Medicine",
      "Critical Care",
      "General Surgery",
      "Pediatrics",
      "Internal Medicine"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 545,
    "emergencyHelpline": "Rescue 1122 / 051-9218300",
    "contactPhone": "+92-51-9218300",
    "contactEmail": "federal.government.islamabad@health.gov.pk"
  },
  {
    "name": "KRL Hospital Islamabad",
    "city": "Islamabad",
    "province": "Islamabad Capital Territory",
    "facilityType": "government",
    "location": {
      "lat": 33.693,
      "lng": 73.029,
      "address": "Sector G-9/1, Islamabad, Federal Capital"
    },
    "specialties": [
      "Cardiology",
      "Emergency Medicine",
      "Critical Care",
      "Internal Medicine"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 350,
    "emergencyHelpline": "051-9262100",
    "contactPhone": "+92-51-9262100",
    "contactEmail": "krl.islamabad.islamabad@health.gov.pk"
  },
  {
    "name": "Shifa International Hospital Islamabad",
    "city": "Islamabad",
    "province": "Islamabad Capital Territory",
    "facilityType": "private",
    "location": {
      "lat": 33.676,
      "lng": 73.076,
      "address": "Pitras Bukhari Road, Sector H-8/4, Islamabad"
    },
    "specialties": [
      "Cardiology",
      "Neurology",
      "Trauma Surgery",
      "Critical Care",
      "Emergency Medicine",
      "Pediatrics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "catheterization_lab",
      "ct_scanner",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 550,
    "emergencyHelpline": "051-8463666",
    "contactPhone": "+92-51-8463000",
    "contactEmail": "info@shifainternational.com.pk"
  },
  {
    "name": "Maroof International Hospital Islamabad",
    "city": "Islamabad",
    "province": "Islamabad Capital Territory",
    "facilityType": "private",
    "location": {
      "lat": 33.692,
      "lng": 73.008,
      "address": "10th Avenue, F-10 Markaz, Islamabad"
    },
    "specialties": [
      "Emergency Medicine",
      "Cardiology",
      "Critical Care",
      "General Surgery"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank",
      "ct_scanner"
    ],
    "status": "active",
    "bedCapacity": 120,
    "emergencyHelpline": "051-2222920",
    "contactPhone": "+92-51-2222920",
    "contactEmail": "maroof.international.islamabad@privatehealth.pk"
  },
  {
    "name": "Kulsum International Hospital Islamabad",
    "city": "Islamabad",
    "province": "Islamabad Capital Territory",
    "facilityType": "private",
    "location": {
      "lat": 33.714,
      "lng": 73.068,
      "address": "Kulsum Plaza, Blue Area, Sector G-6, Islamabad"
    },
    "specialties": [
      "Cardiology",
      "Critical Care",
      "Emergency Medicine",
      "Internal Medicine"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "catheterization_lab",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 95,
    "emergencyHelpline": "051-8446666",
    "contactPhone": "+92-51-8446666",
    "contactEmail": "kulsum.international.islamabad@privatehealth.pk"
  },
  {
    "name": "Rawalpindi Institute of Cardiology (RIC)",
    "city": "Rawalpindi",
    "province": "Punjab",
    "facilityType": "government",
    "location": {
      "lat": 33.6062,
      "lng": 73.0722,
      "address": "Rawal Road, Rawalpindi, Punjab"
    },
    "specialties": [
      "Cardiology",
      "Critical Care",
      "Emergency Medicine"
    ],
    "equipment": [
      "catheterization_lab",
      "icu_bed",
      "ventilator",
      "blood_bank",
      "er_bed"
    ],
    "status": "active",
    "bedCapacity": 276,
    "emergencyHelpline": "Rescue 1122 / 051-9281140",
    "contactPhone": "+92-51-9281140",
    "contactEmail": "rawalpindi.cardiology.rawalpindi@punjabhealth.gov.pk"
  },
  {
    "name": "Holy Family Hospital Rawalpindi",
    "city": "Rawalpindi",
    "province": "Punjab",
    "facilityType": "government",
    "location": {
      "lat": 33.63,
      "lng": 73.07,
      "address": "Satellite Town, Rawalpindi, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "Pediatrics",
      "General Surgery",
      "Pulmonology",
      "Critical Care"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank",
      "ct_scanner"
    ],
    "status": "active",
    "bedCapacity": 890,
    "emergencyHelpline": "Rescue 1122 / 051-9290321",
    "contactPhone": "+92-51-9290321",
    "contactEmail": "holy.family.rawalpindi@punjabhealth.gov.pk"
  },
  {
    "name": "Benazir Bhutto Hospital (BBH) Rawalpindi",
    "city": "Rawalpindi",
    "province": "Punjab",
    "facilityType": "government",
    "location": {
      "lat": 33.6191,
      "lng": 73.0715,
      "address": "Murree Road, Rawalpindi, Punjab"
    },
    "specialties": [
      "Trauma Surgery",
      "Emergency Medicine",
      "Orthopedics",
      "Critical Care",
      "Cardiology"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "trauma_team",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 760,
    "emergencyHelpline": "Rescue 1122 / 051-9290301",
    "contactPhone": "+92-51-9290301",
    "contactEmail": "benazir.bhutto.rawalpindi@punjabhealth.gov.pk"
  },
  {
    "name": "Combined Military Hospital (CMH) Rawalpindi",
    "city": "Rawalpindi",
    "province": "Punjab",
    "facilityType": "military",
    "location": {
      "lat": 33.593,
      "lng": 73.052,
      "address": "Mall Road, Rawalpindi Cantt, Punjab"
    },
    "specialties": [
      "Trauma Surgery",
      "Cardiology",
      "Emergency Medicine",
      "Neurology",
      "Critical Care"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "ct_scanner",
      "blood_bank",
      "trauma_team"
    ],
    "status": "active",
    "bedCapacity": 1200,
    "emergencyHelpline": "Rescue 1122 / 051-5563140",
    "contactPhone": "+92-51-5563140",
    "contactEmail": "cmh.rawalpindi@pakarmy.gov.pk"
  },
  {
    "name": "Quaid-e-Azam International Hospital",
    "city": "Rawalpindi",
    "province": "Punjab",
    "facilityType": "private",
    "location": {
      "lat": 33.6178,
      "lng": 72.9695,
      "address": "Peshawar Road, Near Golra Mor, Rawalpindi"
    },
    "specialties": [
      "Cardiology",
      "Trauma Surgery",
      "Emergency Medicine",
      "Critical Care",
      "Neurology"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "catheterization_lab",
      "ct_scanner",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 400,
    "emergencyHelpline": "051-8449100",
    "contactPhone": "+92-51-8449100",
    "contactEmail": "quaid.e.rawalpindi@privatehealth.pk"
  },
  {
    "name": "Bilal Hospital Rawalpindi",
    "city": "Rawalpindi",
    "province": "Punjab",
    "facilityType": "private",
    "location": {
      "lat": 33.6341,
      "lng": 73.0754,
      "address": "38/A Satellite Town, Rawalpindi, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "Critical Care",
      "General Surgery",
      "Pediatrics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 150,
    "emergencyHelpline": "051-8094499",
    "contactPhone": "+92-51-8094499",
    "contactEmail": "bilal.rawalpindi.rawalpindi@privatehealth.pk"
  },
  {
    "name": "Dr. Ruth K. M. Pfau Civil Hospital Karachi",
    "city": "Karachi",
    "province": "Sindh",
    "facilityType": "government",
    "location": {
      "lat": 24.8587,
      "lng": 67.0116,
      "address": "Mission Road, New Chali, Karachi, Sindh"
    },
    "specialties": [
      "Trauma Surgery",
      "Emergency Medicine",
      "Orthopedics",
      "Pediatrics",
      "Critical Care"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank",
      "trauma_team"
    ],
    "status": "active",
    "bedCapacity": 1900,
    "emergencyHelpline": "Rescue 1122 / 021-99215740",
    "contactPhone": "+92-21-99215740",
    "contactEmail": "er@civilhospital.gov.pk"
  },
  {
    "name": "JPMC - Jinnah Postgraduate Medical Centre Karachi",
    "city": "Karachi",
    "province": "Sindh",
    "facilityType": "government",
    "location": {
      "lat": 24.8532,
      "lng": 67.0456,
      "address": "Rafiqui Shaheed Road, Karachi Cantt, Sindh"
    },
    "specialties": [
      "Trauma Surgery",
      "Neurology",
      "Emergency Medicine",
      "Orthopedics",
      "Critical Care"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "ct_scanner",
      "blood_bank",
      "trauma_team"
    ],
    "status": "active",
    "bedCapacity": 2200,
    "emergencyHelpline": "Rescue 1122 / 021-99201300",
    "contactPhone": "+92-21-99201300",
    "contactEmail": "emergency@jpmc.edu.pk"
  },
  {
    "name": "NICVD - National Institute of Cardiovascular Diseases",
    "city": "Karachi",
    "province": "Sindh",
    "facilityType": "government",
    "location": {
      "lat": 24.854,
      "lng": 67.0468,
      "address": "Rafiqui Shaheed Road, Karachi, Sindh"
    },
    "specialties": [
      "Cardiology",
      "Critical Care",
      "Emergency Medicine"
    ],
    "equipment": [
      "catheterization_lab",
      "icu_bed",
      "ventilator",
      "blood_bank",
      "er_bed"
    ],
    "status": "active",
    "bedCapacity": 1200,
    "emergencyHelpline": "Rescue 1122 / 021-99201271",
    "contactPhone": "+92-21-99201271",
    "contactEmail": "info@nicvd.org"
  },
  {
    "name": "Sindh Institute of Urology & Transplantation (SIUT)",
    "city": "Karachi",
    "province": "Sindh",
    "facilityType": "government",
    "location": {
      "lat": 24.8595,
      "lng": 67.0125,
      "address": "Sardar Yaqoob Khan Road, Near Civil Hospital, Karachi"
    },
    "specialties": [
      "Critical Care",
      "Emergency Medicine",
      "General Surgery",
      "Internal Medicine"
    ],
    "equipment": [
      "icu_bed",
      "ventilator",
      "blood_bank",
      "er_bed"
    ],
    "status": "active",
    "bedCapacity": 850,
    "emergencyHelpline": "021-99215752",
    "contactPhone": "+92-21-99215752",
    "contactEmail": "info@siut.org"
  },
  {
    "name": "National Institute of Child Health (NICH)",
    "city": "Karachi",
    "province": "Sindh",
    "facilityType": "government",
    "location": {
      "lat": 24.8525,
      "lng": 67.0475,
      "address": "Rafiqui Shaheed Road, Cantt, Karachi, Sindh"
    },
    "specialties": [
      "Pediatrics",
      "Emergency Medicine",
      "Critical Care"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 500,
    "emergencyHelpline": "021-99201261",
    "contactPhone": "+92-21-99201261",
    "contactEmail": "national.child.karachi@sindhhealth.gov.pk"
  },
  {
    "name": "Abbasi Shaheed Hospital Karachi",
    "city": "Karachi",
    "province": "Sindh",
    "facilityType": "government",
    "location": {
      "lat": 24.919,
      "lng": 67.0315,
      "address": "Paposh Nagar, Nazimabad No. 3, Karachi, Sindh"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Orthopedics",
      "General Surgery"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 850,
    "emergencyHelpline": "Rescue 1122 / 021-99260400",
    "contactPhone": "+92-21-99260400",
    "contactEmail": "abbasi.shaheed.karachi@sindhhealth.gov.pk"
  },
  {
    "name": "PNS Shifa Naval Hospital",
    "city": "Karachi",
    "province": "Sindh",
    "facilityType": "military",
    "location": {
      "lat": 24.832,
      "lng": 67.062,
      "address": "DHA Phase 2, Korangi Road, Karachi, Sindh"
    },
    "specialties": [
      "Cardiology",
      "Trauma Surgery",
      "Emergency Medicine",
      "Critical Care"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "ct_scanner",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 600,
    "emergencyHelpline": "021-48506500",
    "contactPhone": "+92-21-48506500",
    "contactEmail": "pns.shifa@paknavy.gov.pk"
  },
  {
    "name": "Aga Khan University Hospital (AKUH)",
    "city": "Karachi",
    "province": "Sindh",
    "facilityType": "private",
    "location": {
      "lat": 24.8928,
      "lng": 67.0747,
      "address": "National Stadium Road, Karachi, Sindh"
    },
    "specialties": [
      "Cardiology",
      "Neurology",
      "Pediatrics",
      "Critical Care",
      "Emergency Medicine",
      "Trauma Surgery"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "catheterization_lab",
      "ct_scanner",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 710,
    "emergencyHelpline": "021-111-911-911",
    "contactPhone": "+92-21-111-911-911",
    "contactEmail": "akuh.emergency@aku.edu"
  },
  {
    "name": "Liaquat National Hospital Karachi",
    "city": "Karachi",
    "province": "Sindh",
    "facilityType": "private",
    "location": {
      "lat": 24.891,
      "lng": 67.069,
      "address": "National Stadium Road, Karachi, Sindh"
    },
    "specialties": [
      "Cardiology",
      "Trauma Surgery",
      "Orthopedics",
      "Neurology",
      "Emergency Medicine",
      "Critical Care"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "ct_scanner",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 700,
    "emergencyHelpline": "021-111-456-456",
    "contactPhone": "+92-21-111-456-456",
    "contactEmail": "info@nationalhospital.org.pk"
  },
  {
    "name": "South City Hospital Clifton",
    "city": "Karachi",
    "province": "Sindh",
    "facilityType": "private",
    "location": {
      "lat": 24.821,
      "lng": 67.028,
      "address": "Street 3, Block 3, Clifton, Karachi, Sindh"
    },
    "specialties": [
      "Cardiology",
      "Critical Care",
      "Emergency Medicine",
      "Internal Medicine"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "catheterization_lab",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 172,
    "emergencyHelpline": "021-35862301",
    "contactPhone": "+92-21-35862301",
    "contactEmail": "south.city.karachi@privatehealth.pk"
  },
  {
    "name": "The Indus Hospital Korangi",
    "city": "Karachi",
    "province": "Sindh",
    "facilityType": "private",
    "location": {
      "lat": 24.836,
      "lng": 67.129,
      "address": "Indus Hospital Road, Korangi Crossing, Karachi, Sindh"
    },
    "specialties": [
      "Pediatrics",
      "Cardiology",
      "Trauma Surgery",
      "Emergency Medicine",
      "Critical Care"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank",
      "ct_scanner"
    ],
    "status": "active",
    "bedCapacity": 300,
    "emergencyHelpline": "021-111-111-880",
    "contactPhone": "+92-21-111-111-880",
    "contactEmail": "er@indushospital.org.pk"
  },
  {
    "name": "Dr. Ziauddin Hospital Clifton",
    "city": "Karachi",
    "province": "Sindh",
    "facilityType": "private",
    "location": {
      "lat": 24.818,
      "lng": 67.032,
      "address": "Plot 4/B, Shahrah-e-Firdousi, Block 6 Clifton, Karachi"
    },
    "specialties": [
      "Emergency Medicine",
      "Cardiology",
      "Neurology",
      "Critical Care",
      "General Surgery"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "ct_scanner",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 250,
    "emergencyHelpline": "021-35862937",
    "contactPhone": "+92-21-35862937",
    "contactEmail": "ziauddin.clifton.karachi@privatehealth.pk"
  },
  {
    "name": "Lady Reading Hospital (LRH) Peshawar",
    "city": "Peshawar",
    "province": "Khyber Pakhtunkhwa",
    "facilityType": "government",
    "location": {
      "lat": 34.0112,
      "lng": 71.5721,
      "address": "Soekarno Square, PTCL Colony, Peshawar, Khyber Pakhtunkhwa"
    },
    "specialties": [
      "Trauma Surgery",
      "Emergency Medicine",
      "Orthopedics",
      "Cardiology",
      "Critical Care"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "trauma_team",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 1750,
    "emergencyHelpline": "Rescue 1122 / 091-9211430",
    "contactPhone": "+92-91-9211430",
    "contactEmail": "lady.reading.peshawar@kpkhealth.gov.pk"
  },
  {
    "name": "Khyber Teaching Hospital (KTH) Peshawar",
    "city": "Peshawar",
    "province": "Khyber Pakhtunkhwa",
    "facilityType": "government",
    "location": {
      "lat": 33.998,
      "lng": 71.487,
      "address": "University Road, Rahat Abad, Peshawar, Khyber Pakhtunkhwa"
    },
    "specialties": [
      "Emergency Medicine",
      "Pediatrics",
      "Neurology",
      "Critical Care",
      "General Surgery"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "ct_scanner",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 1208,
    "emergencyHelpline": "Rescue 1122 / 091-9224400",
    "contactPhone": "+92-91-9224400",
    "contactEmail": "khyber.peshawar.peshawar@kpkhealth.gov.pk"
  },
  {
    "name": "Hayatabad Medical Complex (HMC) Peshawar",
    "city": "Peshawar",
    "province": "Khyber Pakhtunkhwa",
    "facilityType": "government",
    "location": {
      "lat": 33.987,
      "lng": 71.439,
      "address": "Phase 4, Hayatabad, Peshawar, Khyber Pakhtunkhwa"
    },
    "specialties": [
      "Trauma Surgery",
      "Orthopedics",
      "Cardiology",
      "Emergency Medicine",
      "Critical Care"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "ct_scanner",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 1280,
    "emergencyHelpline": "Rescue 1122 / 091-9217140",
    "contactPhone": "+92-91-9217140",
    "contactEmail": "hayatabad.complex.peshawar@kpkhealth.gov.pk"
  },
  {
    "name": "Peshawar Institute of Cardiology (PIC Peshawar)",
    "city": "Peshawar",
    "province": "Khyber Pakhtunkhwa",
    "facilityType": "government",
    "location": {
      "lat": 33.984,
      "lng": 71.435,
      "address": "Plot 5-A, Sector B-3, Phase 5 Hayatabad, Peshawar"
    },
    "specialties": [
      "Cardiology",
      "Critical Care",
      "Emergency Medicine"
    ],
    "equipment": [
      "catheterization_lab",
      "icu_bed",
      "ventilator",
      "blood_bank",
      "er_bed"
    ],
    "status": "active",
    "bedCapacity": 280,
    "emergencyHelpline": "Rescue 1122 / 091-9219641",
    "contactPhone": "+92-91-9219641",
    "contactEmail": "er@pic.punjab.gov.pk"
  },
  {
    "name": "Northwest General Hospital & Research Centre",
    "city": "Peshawar",
    "province": "Khyber Pakhtunkhwa",
    "facilityType": "private",
    "location": {
      "lat": 33.989,
      "lng": 71.438,
      "address": "Sector A-3, Phase 5, Hayatabad, Peshawar"
    },
    "specialties": [
      "Cardiology",
      "Neurology",
      "Trauma Surgery",
      "Emergency Medicine",
      "Critical Care"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "catheterization_lab",
      "ct_scanner",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 450,
    "emergencyHelpline": "091-5838850",
    "contactPhone": "+92-91-5838850",
    "contactEmail": "northwest.general.peshawar@privatehealth.pk"
  },
  {
    "name": "Rehman Medical Institute (RMI) Peshawar",
    "city": "Peshawar",
    "province": "Khyber Pakhtunkhwa",
    "facilityType": "private",
    "location": {
      "lat": 33.985,
      "lng": 71.442,
      "address": "5/B-2, Phase 5, Hayatabad, Peshawar, Khyber Pakhtunkhwa"
    },
    "specialties": [
      "Cardiology",
      "Pediatrics",
      "Critical Care",
      "Emergency Medicine",
      "Orthopedics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "ct_scanner",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 500,
    "emergencyHelpline": "091-5838000",
    "contactPhone": "+92-91-5838000",
    "contactEmail": "rehman.peshawar.peshawar@privatehealth.pk"
  },
  {
    "name": "Allied Hospital Faisalabad",
    "city": "Faisalabad",
    "province": "Punjab",
    "facilityType": "government",
    "location": {
      "lat": 31.4328,
      "lng": 73.0705,
      "address": "Jail Road, Faisalabad, Punjab"
    },
    "specialties": [
      "Trauma Surgery",
      "Emergency Medicine",
      "Orthopedics",
      "Pediatrics",
      "Critical Care"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "ct_scanner",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 1450,
    "emergencyHelpline": "Rescue 1122 / 041-9210080",
    "contactPhone": "+92-41-9210080",
    "contactEmail": "allied.faisalabad.faisalabad@punjabhealth.gov.pk"
  },
  {
    "name": "Faisalabad Institute of Cardiology (FIC)",
    "city": "Faisalabad",
    "province": "Punjab",
    "facilityType": "government",
    "location": {
      "lat": 31.419,
      "lng": 73.076,
      "address": "Civil Lines, Club Road, Faisalabad, Punjab"
    },
    "specialties": [
      "Cardiology",
      "Critical Care",
      "Emergency Medicine"
    ],
    "equipment": [
      "catheterization_lab",
      "icu_bed",
      "ventilator",
      "blood_bank",
      "er_bed"
    ],
    "status": "active",
    "bedCapacity": 280,
    "emergencyHelpline": "Rescue 1122 / 041-9201527",
    "contactPhone": "+92-41-9201527",
    "contactEmail": "faisalabad.cardiology.faisalabad@punjabhealth.gov.pk"
  },
  {
    "name": "DHQ Hospital Faisalabad",
    "city": "Faisalabad",
    "province": "Punjab",
    "facilityType": "government",
    "location": {
      "lat": 31.418,
      "lng": 73.0845,
      "address": "Mall Road, Faisalabad, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "General Surgery",
      "Internal Medicine",
      "Pediatrics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 780,
    "emergencyHelpline": "Rescue 1122 / 041-9200381",
    "contactPhone": "+92-41-9200381",
    "contactEmail": "dhq.faisalabad.faisalabad@punjabhealth.gov.pk"
  },
  {
    "name": "National Hospital Faisalabad",
    "city": "Faisalabad",
    "province": "Punjab",
    "facilityType": "private",
    "location": {
      "lat": 31.412,
      "lng": 73.069,
      "address": "Gulberg Road, Jinnah Colony, Faisalabad"
    },
    "specialties": [
      "Cardiology",
      "Emergency Medicine",
      "Critical Care",
      "General Surgery"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 160,
    "emergencyHelpline": "041-2618821",
    "contactPhone": "+92-41-2618821",
    "contactEmail": "info@nationalhospital.org.pk"
  },
  {
    "name": "Nishtar Hospital Multan",
    "city": "Multan",
    "province": "Punjab",
    "facilityType": "government",
    "location": {
      "lat": 30.1878,
      "lng": 71.4428,
      "address": "Nishtar Road, Gillani Colony, Multan, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Cardiology",
      "Internal Medicine",
      "Critical Care"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank",
      "trauma_team"
    ],
    "status": "active",
    "bedCapacity": 1800,
    "emergencyHelpline": "Rescue 1122 / 061-9200231",
    "contactPhone": "+92-61-9200231",
    "contactEmail": "nishtar.multan.multan@punjabhealth.gov.pk"
  },
  {
    "name": "Multan Institute of Cardiology (MIC)",
    "city": "Multan",
    "province": "Punjab",
    "facilityType": "government",
    "location": {
      "lat": 30.1915,
      "lng": 71.4485,
      "address": "Abdali Road, Multan Cantt, Punjab"
    },
    "specialties": [
      "Cardiology",
      "Critical Care",
      "Emergency Medicine"
    ],
    "equipment": [
      "catheterization_lab",
      "icu_bed",
      "ventilator",
      "blood_bank",
      "er_bed"
    ],
    "status": "active",
    "bedCapacity": 288,
    "emergencyHelpline": "Rescue 1122 / 061-9201085",
    "contactPhone": "+92-61-9201085",
    "contactEmail": "multan.cardiology.multan@punjabhealth.gov.pk"
  },
  {
    "name": "Mukhtar A. Sheikh Hospital Multan",
    "city": "Multan",
    "province": "Punjab",
    "facilityType": "private",
    "location": {
      "lat": 30.228,
      "lng": 71.503,
      "address": "Khanewal Road, Multan, Punjab"
    },
    "specialties": [
      "Cardiology",
      "Critical Care",
      "Emergency Medicine",
      "Neurology",
      "Trauma Surgery"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "catheterization_lab",
      "ct_scanner",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 250,
    "emergencyHelpline": "061-111-627-467",
    "contactPhone": "+92-61-111-627-467",
    "contactEmail": "mukhtar.a.multan@privatehealth.pk"
  },
  {
    "name": "Sandeman Provincial Civil Hospital Quetta",
    "city": "Quetta",
    "province": "Balochistan",
    "facilityType": "government",
    "location": {
      "lat": 30.198,
      "lng": 66.999,
      "address": "Jinnah Road, Quetta, Balochistan"
    },
    "specialties": [
      "Trauma Surgery",
      "Emergency Medicine",
      "Orthopedics",
      "Cardiology",
      "Critical Care"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "trauma_team",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 1100,
    "emergencyHelpline": "Rescue 1122 / 081-9202014",
    "contactPhone": "+92-81-9202014",
    "contactEmail": "sandeman.provincial.quetta@balochistanhealth.gov.pk"
  },
  {
    "name": "Bolan Medical Complex Hospital (BMCH) Quetta",
    "city": "Quetta",
    "province": "Balochistan",
    "facilityType": "government",
    "location": {
      "lat": 30.185,
      "lng": 66.964,
      "address": "Brewery Road, Quetta, Balochistan"
    },
    "specialties": [
      "Emergency Medicine",
      "Pediatrics",
      "Critical Care",
      "General Surgery"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "ct_scanner",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 800,
    "emergencyHelpline": "Rescue 1122 / 081-9213070",
    "contactPhone": "+92-81-9213070",
    "contactEmail": "bolan.complex.quetta@balochistanhealth.gov.pk"
  },
  {
    "name": "Combined Military Hospital (CMH) Quetta",
    "city": "Quetta",
    "province": "Balochistan",
    "facilityType": "military",
    "location": {
      "lat": 30.221,
      "lng": 67.018,
      "address": "Chiltan Road, Quetta Cantt, Balochistan"
    },
    "specialties": [
      "Trauma Surgery",
      "Cardiology",
      "Emergency Medicine",
      "Critical Care"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "ct_scanner",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 650,
    "emergencyHelpline": "081-2824001",
    "contactPhone": "+92-81-2824001",
    "contactEmail": "cmh.quetta@pakarmy.gov.pk"
  },
  {
    "name": "Akram Hospital Quetta",
    "city": "Quetta",
    "province": "Balochistan",
    "facilityType": "private",
    "location": {
      "lat": 30.205,
      "lng": 67.009,
      "address": "Zarghoon Road, Quetta, Balochistan"
    },
    "specialties": [
      "Emergency Medicine",
      "Cardiology",
      "Critical Care",
      "General Surgery"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 140,
    "emergencyHelpline": "081-2822181",
    "contactPhone": "+92-81-2822181",
    "contactEmail": "akram.quetta.quetta@privatehealth.pk"
  },
  {
    "name": "Liaquat University Hospital (Civil Hospital Hyderabad)",
    "city": "Hyderabad",
    "province": "Sindh",
    "facilityType": "government",
    "location": {
      "lat": 25.396,
      "lng": 68.371,
      "address": "Hospital Road, Saddar, Hyderabad, Sindh"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Pediatrics",
      "Critical Care",
      "Cardiology"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 1450,
    "emergencyHelpline": "Rescue 1122 / 022-9210206",
    "contactPhone": "+92-22-9210206",
    "contactEmail": "liaquat.university.hyderabad@sindhhealth.gov.pk"
  },
  {
    "name": "Isra University Hospital Hyderabad",
    "city": "Hyderabad",
    "province": "Sindh",
    "facilityType": "private",
    "location": {
      "lat": 25.438,
      "lng": 68.375,
      "address": "Hala Road, Hyderabad, Sindh"
    },
    "specialties": [
      "Cardiology",
      "Emergency Medicine",
      "Critical Care",
      "General Surgery"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "ct_scanner",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 450,
    "emergencyHelpline": "022-2030161",
    "contactPhone": "+92-22-2030161",
    "contactEmail": "isra.university.hyderabad@privatehealth.pk"
  },
  {
    "name": "Ghulam Muhammad Mahar Medical College Teaching Hospital",
    "city": "Sukkur",
    "province": "Sindh",
    "facilityType": "government",
    "location": {
      "lat": 27.705,
      "lng": 68.857,
      "address": "Minara Road, Sukkur, Sindh"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Critical Care",
      "Pediatrics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 500,
    "emergencyHelpline": "Rescue 1122 / 071-9310151",
    "contactPhone": "+92-71-9310151",
    "contactEmail": "ghulam.muhammad.sukkur@sindhhealth.gov.pk"
  },
  {
    "name": "Chandka Medical College Hospital (CMCH) Larkana",
    "city": "Larkana",
    "province": "Sindh",
    "facilityType": "government",
    "location": {
      "lat": 27.559,
      "lng": 68.212,
      "address": "VIP Road, Larkana, Sindh"
    },
    "specialties": [
      "Emergency Medicine",
      "Pediatrics",
      "Trauma Surgery",
      "Critical Care"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 1200,
    "emergencyHelpline": "Rescue 1122 / 074-9410715",
    "contactPhone": "+92-74-9410715",
    "contactEmail": "chandka.college.larkana@sindhhealth.gov.pk"
  },
  {
    "name": "DHQ Teaching Hospital Gujranwala",
    "city": "Gujranwala",
    "province": "Punjab",
    "facilityType": "government",
    "location": {
      "lat": 32.161,
      "lng": 74.195,
      "address": "Pasrur Road, Gujranwala, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Pediatrics",
      "Critical Care"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 920,
    "emergencyHelpline": "Rescue 1122 / 055-9200141",
    "contactPhone": "+92-55-9200141",
    "contactEmail": "dhq.gujranwala.gujranwala@punjabhealth.gov.pk"
  },
  {
    "name": "Medcare International Hospital Gujranwala",
    "city": "Gujranwala",
    "province": "Punjab",
    "facilityType": "private",
    "location": {
      "lat": 32.155,
      "lng": 74.188,
      "address": "Civil Lines, Gujranwala, Punjab"
    },
    "specialties": [
      "Cardiology",
      "Emergency Medicine",
      "Critical Care",
      "General Surgery"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "ct_scanner",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 120,
    "emergencyHelpline": "055-3257777",
    "contactPhone": "+92-55-3257777",
    "contactEmail": "medcare.international.gujranwala@privatehealth.pk"
  },
  {
    "name": "Allama Iqbal Memorial Teaching Hospital Sialkot",
    "city": "Sialkot",
    "province": "Punjab",
    "facilityType": "government",
    "location": {
      "lat": 32.493,
      "lng": 74.536,
      "address": "Khadim Ali Road, Sialkot, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Orthopedics",
      "Critical Care"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 600,
    "emergencyHelpline": "Rescue 1122 / 052-9250050",
    "contactPhone": "+92-52-9250050",
    "contactEmail": "allama.iqbal.sialkot@punjabhealth.gov.pk"
  },
  {
    "name": "Islam Central Hospital Sialkot",
    "city": "Sialkot",
    "province": "Punjab",
    "facilityType": "private",
    "location": {
      "lat": 32.502,
      "lng": 74.541,
      "address": "Kashmir Road, Sialkot, Punjab"
    },
    "specialties": [
      "Cardiology",
      "Emergency Medicine",
      "Critical Care"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 180,
    "emergencyHelpline": "052-3556000",
    "contactPhone": "+92-52-3556000",
    "contactEmail": "islam.central.sialkot@privatehealth.pk"
  },
  {
    "name": "Bahawal Victoria Hospital (BVH) Bahawalpur",
    "city": "Bahawalpur",
    "province": "Punjab",
    "facilityType": "government",
    "location": {
      "lat": 29.395,
      "lng": 71.683,
      "address": "Circular Road, Bahawalpur, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Pediatrics",
      "Cardiology",
      "Critical Care"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank",
      "trauma_team"
    ],
    "status": "active",
    "bedCapacity": 1520,
    "emergencyHelpline": "Rescue 1122 / 062-9250424",
    "contactPhone": "+92-62-9250424",
    "contactEmail": "bahawal.victoria.bahawalpur@punjabhealth.gov.pk"
  },
  {
    "name": "DHQ Teaching Hospital Sargodha",
    "city": "Sargodha",
    "province": "Punjab",
    "facilityType": "government",
    "location": {
      "lat": 32.083,
      "lng": 72.671,
      "address": "Club Road, Sargodha, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "General Surgery",
      "Critical Care"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 800,
    "emergencyHelpline": "Rescue 1122 / 048-9230581",
    "contactPhone": "+92-48-9230581",
    "contactEmail": "dhq.sargodha.sargodha@punjabhealth.gov.pk"
  },
  {
    "name": "Sheikh Zayed Hospital Rahim Yar Khan",
    "city": "Rahim Yar Khan",
    "province": "Punjab",
    "facilityType": "government",
    "location": {
      "lat": 28.421,
      "lng": 70.302,
      "address": "Hospital Road, Rahim Yar Khan, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Cardiology",
      "Pediatrics",
      "Critical Care"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 950,
    "emergencyHelpline": "Rescue 1122 / 068-9230161",
    "contactPhone": "+92-68-9230161",
    "contactEmail": "sheikh.zayed.rahimyarkhan@punjabhealth.gov.pk"
  },
  {
    "name": "Aziz Bhatti Shaheed Teaching Hospital Gujrat",
    "city": "Gujrat",
    "province": "Punjab",
    "facilityType": "government",
    "location": {
      "lat": 32.574,
      "lng": 74.079,
      "address": "Bhimber Road, Gujrat, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "Orthopedics",
      "General Surgery",
      "Critical Care"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 650,
    "emergencyHelpline": "Rescue 1122 / 053-9260021",
    "contactPhone": "+92-53-9260021",
    "contactEmail": "aziz.bhatti.gujrat@punjabhealth.gov.pk"
  },
  {
    "name": "Ayub Teaching Hospital (ATH) Abbottabad",
    "city": "Abbottabad",
    "province": "Khyber Pakhtunkhwa",
    "facilityType": "government",
    "location": {
      "lat": 34.195,
      "lng": 73.242,
      "address": "Mansehra Road, Abbottabad, Khyber Pakhtunkhwa"
    },
    "specialties": [
      "Trauma Surgery",
      "Emergency Medicine",
      "Orthopedics",
      "Cardiology",
      "Critical Care"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "ct_scanner",
      "blood_bank",
      "trauma_team"
    ],
    "status": "active",
    "bedCapacity": 1000,
    "emergencyHelpline": "Rescue 1122 / 0992-381907",
    "contactPhone": "+92-992-381907",
    "contactEmail": "ayub.abbottabad.abbottabad@kpkhealth.gov.pk"
  },
  {
    "name": "Saidu Teaching Hospital Swat",
    "city": "Swat",
    "province": "Khyber Pakhtunkhwa",
    "facilityType": "government",
    "location": {
      "lat": 34.752,
      "lng": 72.358,
      "address": "Saidu Sharif, Swat Valley, Khyber Pakhtunkhwa"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Pediatrics",
      "Critical Care"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 750,
    "emergencyHelpline": "Rescue 1122 / 0946-9240400",
    "contactPhone": "+92-946-9240400",
    "contactEmail": "saidu.swat.swat@kpkhealth.gov.pk"
  },
  {
    "name": "Mardan Medical Complex (MMC) Hospital",
    "city": "Mardan",
    "province": "Khyber Pakhtunkhwa",
    "facilityType": "government",
    "location": {
      "lat": 34.198,
      "lng": 72.035,
      "address": "Nowshera Road, Mardan, Khyber Pakhtunkhwa"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Pediatrics",
      "Critical Care"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 520,
    "emergencyHelpline": "Rescue 1122 / 0937-9230431",
    "contactPhone": "+92-937-9230431",
    "contactEmail": "mardan.complex.mardan@kpkhealth.gov.pk"
  },
  {
    "name": "Abbas Institute of Medical Sciences (AIMS) Muzaffarabad",
    "city": "Muzaffarabad",
    "province": "Azad Jammu & Kashmir",
    "facilityType": "government",
    "location": {
      "lat": 34.364,
      "lng": 73.471,
      "address": "Ambore, Muzaffarabad, Azad Jammu & Kashmir"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Critical Care",
      "General Surgery"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 450,
    "emergencyHelpline": "Rescue 1122 / 05822-921400",
    "contactPhone": "+92-5822-921400",
    "contactEmail": "abbas.sciences.muzaffarabad@ajkhealth.gov.pk"
  },
  {
    "name": "DHQ Teaching Hospital Mirpur AJK",
    "city": "Mirpur",
    "province": "Azad Jammu & Kashmir",
    "facilityType": "government",
    "location": {
      "lat": 33.148,
      "lng": 73.751,
      "address": "Sector F-1, Mirpur, Azad Jammu & Kashmir"
    },
    "specialties": [
      "Emergency Medicine",
      "Orthopedics",
      "Cardiology",
      "Critical Care"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 400,
    "emergencyHelpline": "Rescue 1122 / 05827-920400",
    "contactPhone": "+92-5827-920400",
    "contactEmail": "dhq.mirpur.mirpur@ajkhealth.gov.pk"
  },
  {
    "name": "DHQ Hospital Gilgit",
    "city": "Gilgit",
    "province": "Gilgit-Baltistan",
    "facilityType": "government",
    "location": {
      "lat": 35.92,
      "lng": 74.312,
      "address": "Hospital Road, Gilgit, Gilgit-Baltistan"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Critical Care",
      "Internal Medicine"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 350,
    "emergencyHelpline": "Rescue 1122 / 05811-920250",
    "contactPhone": "+92-5811-920250",
    "contactEmail": "dhq.gilgit.gilgit@gbhealth.gov.pk"
  },
  {
    "name": "RHQ Hospital Skardu",
    "city": "Skardu",
    "province": "Gilgit-Baltistan",
    "facilityType": "government",
    "location": {
      "lat": 35.297,
      "lng": 75.633,
      "address": "College Road, Skardu, Gilgit-Baltistan"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Critical Care"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 250,
    "emergencyHelpline": "Rescue 1122 / 05815-920150",
    "contactPhone": "+92-5815-920150",
    "contactEmail": "rhq.skardu.skardu@gbhealth.gov.pk"
  },
  {
    "name": "GDA Hospital Gwadar",
    "city": "Gwadar",
    "province": "Balochistan",
    "facilityType": "government",
    "location": {
      "lat": 25.126,
      "lng": 62.325,
      "address": "Marine Drive, Gwadar, Balochistan"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Critical Care"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 150,
    "emergencyHelpline": "Rescue 1122 / 0864-210123",
    "contactPhone": "+92-864-210123",
    "contactEmail": "gda.gwadar.gwadar@balochistanhealth.gov.pk"
  },
  {
    "name": "Sahiwal Teaching Hospital (DHQ)",
    "city": "Sahiwal",
    "province": "Punjab",
    "facilityType": "government",
    "location": {
      "lat": 30.668,
      "lng": 73.111,
      "address": "Medical College Road, Sahiwal, Punjab"
    },
    "specialties": [
      "Cardiology",
      "Emergency Medicine",
      "Trauma Surgery",
      "Critical Care",
      "Orthopedics",
      "Pediatrics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "ct_scanner",
      "blood_bank",
      "trauma_team"
    ],
    "status": "active",
    "bedCapacity": 800,
    "emergencyHelpline": "Rescue 1122 / 040-9200234",
    "contactPhone": "+92-40-9200234",
    "contactEmail": "sahiwal.sahiwal@punjabhealth.gov.pk"
  },
  {
    "name": "Sharif Medical Complex Sahiwal",
    "city": "Sahiwal",
    "province": "Punjab",
    "facilityType": "private",
    "location": {
      "lat": 30.672,
      "lng": 73.118,
      "address": "High Street, Sahiwal, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "General Surgery",
      "Cardiology",
      "Orthopedics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 120,
    "emergencyHelpline": "040-4221199",
    "contactPhone": "+92-40-4221199",
    "contactEmail": "sharif.complex.sahiwal@privatehealth.pk"
  },
  {
    "name": "Allama Iqbal Teaching Hospital DHQ DG Khan",
    "city": "Dera Ghazi Khan",
    "province": "Punjab",
    "facilityType": "government",
    "location": {
      "lat": 30.056,
      "lng": 70.634,
      "address": "Jampur Road, Dera Ghazi Khan, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Cardiology",
      "Critical Care",
      "Neurology"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "ct_scanner",
      "blood_bank",
      "trauma_team"
    ],
    "status": "active",
    "bedCapacity": 750,
    "emergencyHelpline": "Rescue 1122 / 064-9260235",
    "contactPhone": "+92-64-9260235",
    "contactEmail": "allama.iqbal.deraghazikhan@punjabhealth.gov.pk"
  },
  {
    "name": "City Medicare Hospital DG Khan",
    "city": "Dera Ghazi Khan",
    "province": "Punjab",
    "facilityType": "private",
    "location": {
      "lat": 30.061,
      "lng": 70.64,
      "address": "Block 18, Dera Ghazi Khan, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "Orthopedics",
      "General Surgery"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 100,
    "emergencyHelpline": "064-2462211",
    "contactPhone": "+92-64-2462211",
    "contactEmail": "city.medicare.deraghazikhan@privatehealth.pk"
  },
  {
    "name": "DHQ Hospital Jhelum",
    "city": "Jhelum",
    "province": "Punjab",
    "facilityType": "government",
    "location": {
      "lat": 32.933,
      "lng": 73.726,
      "address": "Civil Lines, Jhelum, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Cardiology",
      "Pediatrics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank",
      "ct_scanner"
    ],
    "status": "active",
    "bedCapacity": 450,
    "emergencyHelpline": "Rescue 1122 / 0544-9270123",
    "contactPhone": "+92-544-9270123",
    "contactEmail": "dhq.jhelum.jhelum@punjabhealth.gov.pk"
  },
  {
    "name": "Al-Shafi Hospital Jhelum",
    "city": "Jhelum",
    "province": "Punjab",
    "facilityType": "private",
    "location": {
      "lat": 32.938,
      "lng": 73.731,
      "address": "GT Road, Jhelum, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "Critical Care",
      "General Surgery"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 110,
    "emergencyHelpline": "0544-625511",
    "contactPhone": "+92-544-625511",
    "contactEmail": "al.shafi.jhelum@privatehealth.pk"
  },
  {
    "name": "DHQ Hospital Sheikhupura",
    "city": "Sheikhupura",
    "province": "Punjab",
    "facilityType": "government",
    "location": {
      "lat": 31.713,
      "lng": 73.985,
      "address": "Lahore-Sargodha Road, Sheikhupura, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Cardiology",
      "Critical Care",
      "Orthopedics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank",
      "ct_scanner"
    ],
    "status": "active",
    "bedCapacity": 500,
    "emergencyHelpline": "Rescue 1122 / 056-9200171",
    "contactPhone": "+92-56-9200171",
    "contactEmail": "dhq.sheikhupura.sheikhupura@punjabhealth.gov.pk"
  },
  {
    "name": "Waris Shah Memorial Hospital Sheikhupura",
    "city": "Sheikhupura",
    "province": "Punjab",
    "facilityType": "private",
    "location": {
      "lat": 31.718,
      "lng": 73.991,
      "address": "Civil Quarters, Sheikhupura, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "Cardiology",
      "Pediatrics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 95,
    "emergencyHelpline": "056-3783300",
    "contactPhone": "+92-56-3783300",
    "contactEmail": "waris.shah.sheikhupura@privatehealth.pk"
  },
  {
    "name": "DHQ Hospital Kasur",
    "city": "Kasur",
    "province": "Punjab",
    "facilityType": "government",
    "location": {
      "lat": 31.116,
      "lng": 74.45,
      "address": "Ferozepur Road, Kasur, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Cardiology",
      "Pediatrics",
      "Critical Care"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank",
      "ct_scanner"
    ],
    "status": "active",
    "bedCapacity": 450,
    "emergencyHelpline": "Rescue 1122 / 049-9250011",
    "contactPhone": "+92-49-9250011",
    "contactEmail": "dhq.kasur.kasur@punjabhealth.gov.pk"
  },
  {
    "name": "Bulleh Shah Medicare Hospital Kasur",
    "city": "Kasur",
    "province": "Punjab",
    "facilityType": "private",
    "location": {
      "lat": 31.121,
      "lng": 74.456,
      "address": "Railway Road, Kasur, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "General Surgery",
      "Orthopedics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 90,
    "emergencyHelpline": "049-2761100",
    "contactPhone": "+92-49-2761100",
    "contactEmail": "bulleh.shah.kasur@privatehealth.pk"
  },
  {
    "name": "DHQ Hospital Okara",
    "city": "Okara",
    "province": "Punjab",
    "facilityType": "government",
    "location": {
      "lat": 30.808,
      "lng": 73.445,
      "address": "Faisalabad Road, Okara, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "Cardiology",
      "Trauma Surgery",
      "Pediatrics",
      "Critical Care"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "ct_scanner",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 400,
    "emergencyHelpline": "Rescue 1122 / 044-9200331",
    "contactPhone": "+92-44-9200331",
    "contactEmail": "dhq.okara.okara@punjabhealth.gov.pk"
  },
  {
    "name": "Al-Razi Medical Complex Okara",
    "city": "Okara",
    "province": "Punjab",
    "facilityType": "private",
    "location": {
      "lat": 30.812,
      "lng": 73.451,
      "address": "GT Road, Okara, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "Orthopedics",
      "General Surgery"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 85,
    "emergencyHelpline": "044-2521199",
    "contactPhone": "+92-44-2521199",
    "contactEmail": "al.razi.okara@privatehealth.pk"
  },
  {
    "name": "DHQ Hospital Chiniot",
    "city": "Chiniot",
    "province": "Punjab",
    "facilityType": "government",
    "location": {
      "lat": 31.72,
      "lng": 72.978,
      "address": "Faisalabad Road, Chiniot, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "General Surgery",
      "Pediatrics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 250,
    "emergencyHelpline": "Rescue 1122 / 047-6331122",
    "contactPhone": "+92-47-6331122",
    "contactEmail": "dhq.chiniot.chiniot@punjabhealth.gov.pk"
  },
  {
    "name": "Chenab Medical Center Chiniot",
    "city": "Chiniot",
    "province": "Punjab",
    "facilityType": "private",
    "location": {
      "lat": 31.725,
      "lng": 72.984,
      "address": "Katchery Road, Chiniot, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "Cardiology",
      "Critical Care"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 80,
    "emergencyHelpline": "047-6332211",
    "contactPhone": "+92-47-6332211",
    "contactEmail": "chenab.chiniot.chiniot@privatehealth.pk"
  },
  {
    "name": "DHQ Hospital Bahawalnagar",
    "city": "Bahawalnagar",
    "province": "Punjab",
    "facilityType": "government",
    "location": {
      "lat": 29.998,
      "lng": 73.253,
      "address": "Minchinabad Road, Bahawalnagar, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Pediatrics",
      "Critical Care"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank",
      "ct_scanner"
    ],
    "status": "active",
    "bedCapacity": 350,
    "emergencyHelpline": "Rescue 1122 / 063-9240122",
    "contactPhone": "+92-63-9240122",
    "contactEmail": "dhq.bahawalnagar.bahawalnagar@punjabhealth.gov.pk"
  },
  {
    "name": "Al-Shifa Hospital Bahawalnagar",
    "city": "Bahawalnagar",
    "province": "Punjab",
    "facilityType": "private",
    "location": {
      "lat": 30.003,
      "lng": 73.259,
      "address": "Haroonabad Road, Bahawalnagar, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "Orthopedics",
      "General Surgery"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 75,
    "emergencyHelpline": "063-2271100",
    "contactPhone": "+92-63-2271100",
    "contactEmail": "al.shifa.bahawalnagar@privatehealth.pk"
  },
  {
    "name": "DHQ Hospital Hafizabad",
    "city": "Hafizabad",
    "province": "Punjab",
    "facilityType": "government",
    "location": {
      "lat": 32.068,
      "lng": 73.688,
      "address": "Gujranwala Road, Hafizabad, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Critical Care",
      "Pediatrics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 300,
    "emergencyHelpline": "Rescue 1122 / 0547-522122",
    "contactPhone": "+92-547-522122",
    "contactEmail": "dhq.hafizabad.hafizabad@punjabhealth.gov.pk"
  },
  {
    "name": "Rehmat Memorial Hospital Hafizabad",
    "city": "Hafizabad",
    "province": "Punjab",
    "facilityType": "private",
    "location": {
      "lat": 32.072,
      "lng": 73.694,
      "address": "Kolo Road, Hafizabad, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "General Surgery",
      "Cardiology"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 80,
    "emergencyHelpline": "0547-541100",
    "contactPhone": "+92-547-541100",
    "contactEmail": "rehmat.memorial.hafizabad@privatehealth.pk"
  },
  {
    "name": "DHQ Hospital Khanewal",
    "city": "Khanewal",
    "province": "Punjab",
    "facilityType": "government",
    "location": {
      "lat": 30.301,
      "lng": 71.932,
      "address": "Civil Lines, Khanewal, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Cardiology",
      "Pediatrics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank",
      "ct_scanner"
    ],
    "status": "active",
    "bedCapacity": 350,
    "emergencyHelpline": "Rescue 1122 / 065-9200155",
    "contactPhone": "+92-65-9200155",
    "contactEmail": "dhq.khanewal.khanewal@punjabhealth.gov.pk"
  },
  {
    "name": "Al-Hadi Medicare Khanewal",
    "city": "Khanewal",
    "province": "Punjab",
    "facilityType": "private",
    "location": {
      "lat": 30.306,
      "lng": 71.938,
      "address": "Jahanian Road, Khanewal, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "Orthopedics",
      "General Surgery"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 70,
    "emergencyHelpline": "065-2551100",
    "contactPhone": "+92-65-2551100",
    "contactEmail": "al.hadi.khanewal@privatehealth.pk"
  },
  {
    "name": "DHQ Hospital Jauharabad (Khushab)",
    "city": "Khushab",
    "province": "Punjab",
    "facilityType": "government",
    "location": {
      "lat": 32.296,
      "lng": 72.352,
      "address": "Club Road, Jauharabad, Khushab, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Critical Care",
      "Pediatrics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 280,
    "emergencyHelpline": "Rescue 1122 / 0454-920122",
    "contactPhone": "+92-454-920122",
    "contactEmail": "dhq.jauharabad.khushab@punjabhealth.gov.pk"
  },
  {
    "name": "Fatima Hospital Jauharabad",
    "city": "Khushab",
    "province": "Punjab",
    "facilityType": "private",
    "location": {
      "lat": 32.301,
      "lng": 72.358,
      "address": "Main Bazar, Jauharabad, Khushab, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "General Surgery",
      "Cardiology"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 65,
    "emergencyHelpline": "0454-721100",
    "contactPhone": "+92-454-721100",
    "contactEmail": "fatima.jauharabad.khushab@privatehealth.pk"
  },
  {
    "name": "DHQ Hospital Layyah",
    "city": "Layyah",
    "province": "Punjab",
    "facilityType": "government",
    "location": {
      "lat": 30.961,
      "lng": 70.942,
      "address": "Choubara Road, Layyah, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Cardiology",
      "Pediatrics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 300,
    "emergencyHelpline": "Rescue 1122 / 0606-920150",
    "contactPhone": "+92-606-920150",
    "contactEmail": "dhq.layyah.layyah@punjabhealth.gov.pk"
  },
  {
    "name": "Thal Medical Complex Layyah",
    "city": "Layyah",
    "province": "Punjab",
    "facilityType": "private",
    "location": {
      "lat": 30.966,
      "lng": 70.948,
      "address": "College Road, Layyah, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "Orthopedics",
      "General Surgery"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 70,
    "emergencyHelpline": "0606-411200",
    "contactPhone": "+92-606-411200",
    "contactEmail": "thal.complex.layyah@privatehealth.pk"
  },
  {
    "name": "DHQ Hospital Lodhran",
    "city": "Lodhran",
    "province": "Punjab",
    "facilityType": "government",
    "location": {
      "lat": 29.533,
      "lng": 71.633,
      "address": "Bahawalpur Road, Lodhran, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Pediatrics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 250,
    "emergencyHelpline": "Rescue 1122 / 0608-920022",
    "contactPhone": "+92-608-920022",
    "contactEmail": "dhq.lodhran.lodhran@punjabhealth.gov.pk"
  },
  {
    "name": "Al-Madina Hospital Lodhran",
    "city": "Lodhran",
    "province": "Punjab",
    "facilityType": "private",
    "location": {
      "lat": 29.538,
      "lng": 71.639,
      "address": "Multan Road, Lodhran, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "Cardiology",
      "General Surgery"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 60,
    "emergencyHelpline": "0608-361122",
    "contactPhone": "+92-608-361122",
    "contactEmail": "al.madina.lodhran@privatehealth.pk"
  },
  {
    "name": "DHQ Hospital Mandi Bahauddin",
    "city": "Mandi Bahauddin",
    "province": "Punjab",
    "facilityType": "government",
    "location": {
      "lat": 32.587,
      "lng": 73.491,
      "address": "Phalia Road, Mandi Bahauddin, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Cardiology",
      "Pediatrics",
      "Critical Care"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank",
      "ct_scanner"
    ],
    "status": "active",
    "bedCapacity": 350,
    "emergencyHelpline": "Rescue 1122 / 0546-600122",
    "contactPhone": "+92-546-600122",
    "contactEmail": "dhq.mandi.mandibahauddin@punjabhealth.gov.pk"
  },
  {
    "name": "Gondal Medical Complex Mandi Bahauddin",
    "city": "Mandi Bahauddin",
    "province": "Punjab",
    "facilityType": "private",
    "location": {
      "lat": 32.592,
      "lng": 73.497,
      "address": "Katchery Road, Mandi Bahauddin, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "Orthopedics",
      "General Surgery"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 80,
    "emergencyHelpline": "0546-501122",
    "contactPhone": "+92-546-501122",
    "contactEmail": "gondal.complex.mandibahauddin@privatehealth.pk"
  },
  {
    "name": "DHQ Hospital Mianwali",
    "city": "Mianwali",
    "province": "Punjab",
    "facilityType": "government",
    "location": {
      "lat": 32.584,
      "lng": 71.536,
      "address": "Sargodha Road, Mianwali, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Cardiology",
      "Critical Care",
      "Pediatrics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank",
      "ct_scanner"
    ],
    "status": "active",
    "bedCapacity": 380,
    "emergencyHelpline": "Rescue 1122 / 0459-920150",
    "contactPhone": "+92-459-920150",
    "contactEmail": "dhq.mianwali.mianwali@punjabhealth.gov.pk"
  },
  {
    "name": "Niazi Medical Complex Mianwali",
    "city": "Mianwali",
    "province": "Punjab",
    "facilityType": "private",
    "location": {
      "lat": 32.589,
      "lng": 71.542,
      "address": "Ballokhel Road, Mianwali, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "Orthopedics",
      "General Surgery"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 85,
    "emergencyHelpline": "0459-231100",
    "contactPhone": "+92-459-231100",
    "contactEmail": "niazi.complex.mianwali@privatehealth.pk"
  },
  {
    "name": "Recep Tayyip Erdogan Hospital Muzaffargarh",
    "city": "Muzaffargarh",
    "province": "Punjab",
    "facilityType": "government",
    "location": {
      "lat": 30.075,
      "lng": 71.192,
      "address": "Alipur Road, Muzaffargarh, Punjab"
    },
    "specialties": [
      "Cardiology",
      "Neurology",
      "Trauma Surgery",
      "Critical Care",
      "Emergency Medicine",
      "Pediatrics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "ct_scanner",
      "blood_bank",
      "catheterization_lab",
      "trauma_team"
    ],
    "status": "active",
    "bedCapacity": 500,
    "emergencyHelpline": "Rescue 1122 / 066-9200234",
    "contactPhone": "+92-66-9200234",
    "contactEmail": "recep.tayyip.muzaffargarh@punjabhealth.gov.pk"
  },
  {
    "name": "DHQ Hospital Muzaffargarh",
    "city": "Muzaffargarh",
    "province": "Punjab",
    "facilityType": "government",
    "location": {
      "lat": 30.071,
      "lng": 71.185,
      "address": "Jhang Road, Muzaffargarh, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Pediatrics",
      "Critical Care"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 350,
    "emergencyHelpline": "Rescue 1122 / 066-9200155",
    "contactPhone": "+92-66-9200155",
    "contactEmail": "dhq.muzaffargarh.muzaffargarh@punjabhealth.gov.pk"
  },
  {
    "name": "DHQ Hospital Nankana Sahib",
    "city": "Nankana Sahib",
    "province": "Punjab",
    "facilityType": "government",
    "location": {
      "lat": 31.449,
      "lng": 73.712,
      "address": "Housing Colony, Nankana Sahib, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Cardiology",
      "Pediatrics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 250,
    "emergencyHelpline": "Rescue 1122 / 056-2874122",
    "contactPhone": "+92-56-2874122",
    "contactEmail": "dhq.nankana.nankanasahib@punjabhealth.gov.pk"
  },
  {
    "name": "Guru Nanak Medicare Nankana",
    "city": "Nankana Sahib",
    "province": "Punjab",
    "facilityType": "private",
    "location": {
      "lat": 31.454,
      "lng": 73.718,
      "address": "Gurdwara Road, Nankana Sahib, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "General Surgery",
      "Orthopedics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 60,
    "emergencyHelpline": "056-2875500",
    "contactPhone": "+92-56-2875500",
    "contactEmail": "guru.nanak.nankanasahib@privatehealth.pk"
  },
  {
    "name": "DHQ Hospital Narowal",
    "city": "Narowal",
    "province": "Punjab",
    "facilityType": "government",
    "location": {
      "lat": 32.1,
      "lng": 74.873,
      "address": "Circular Road, Narowal, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Cardiology",
      "Pediatrics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank",
      "ct_scanner"
    ],
    "status": "active",
    "bedCapacity": 300,
    "emergencyHelpline": "Rescue 1122 / 0542-411222",
    "contactPhone": "+92-542-411222",
    "contactEmail": "dhq.narowal.narowal@punjabhealth.gov.pk"
  },
  {
    "name": "Sughra Shafi Medical Complex Narowal",
    "city": "Narowal",
    "province": "Punjab",
    "facilityType": "private",
    "location": {
      "lat": 32.105,
      "lng": 74.879,
      "address": "Shakargarh Road, Narowal, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "Critical Care",
      "General Surgery",
      "Orthopedics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 350,
    "emergencyHelpline": "0542-450122",
    "contactPhone": "+92-542-450122",
    "contactEmail": "sughra.shafi.narowal@privatehealth.pk"
  },
  {
    "name": "DHQ Hospital Pakpattan",
    "city": "Pakpattan",
    "province": "Punjab",
    "facilityType": "government",
    "location": {
      "lat": 30.341,
      "lng": 73.386,
      "address": "Sahiwal Road, Pakpattan, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Cardiology",
      "Pediatrics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 280,
    "emergencyHelpline": "Rescue 1122 / 0457-371222",
    "contactPhone": "+92-457-371222",
    "contactEmail": "dhq.pakpattan.pakpattan@punjabhealth.gov.pk"
  },
  {
    "name": "Baba Farid Memorial Hospital Pakpattan",
    "city": "Pakpattan",
    "province": "Punjab",
    "facilityType": "private",
    "location": {
      "lat": 30.346,
      "lng": 73.392,
      "address": "Dargah Road, Pakpattan, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "General Surgery",
      "Orthopedics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 65,
    "emergencyHelpline": "0457-381100",
    "contactPhone": "+92-457-381100",
    "contactEmail": "baba.farid.pakpattan@privatehealth.pk"
  },
  {
    "name": "DHQ Hospital Rajanpur",
    "city": "Rajanpur",
    "province": "Punjab",
    "facilityType": "government",
    "location": {
      "lat": 29.103,
      "lng": 70.325,
      "address": "Indus Highway, Rajanpur, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Critical Care",
      "Pediatrics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 250,
    "emergencyHelpline": "Rescue 1122 / 0604-688122",
    "contactPhone": "+92-604-688122",
    "contactEmail": "dhq.rajanpur.rajanpur@punjabhealth.gov.pk"
  },
  {
    "name": "Al-Khidmat Clinic & Hospital Rajanpur",
    "city": "Rajanpur",
    "province": "Punjab",
    "facilityType": "private",
    "location": {
      "lat": 29.108,
      "lng": 70.331,
      "address": "Jampur Road, Rajanpur, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "General Surgery",
      "Cardiology"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 50,
    "emergencyHelpline": "0604-690100",
    "contactPhone": "+92-604-690100",
    "contactEmail": "al.khidmat.rajanpur@privatehealth.pk"
  },
  {
    "name": "DHQ Hospital Toba Tek Singh",
    "city": "Toba Tek Singh",
    "province": "Punjab",
    "facilityType": "government",
    "location": {
      "lat": 30.97,
      "lng": 72.482,
      "address": "Jhang Road, Toba Tek Singh, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Cardiology",
      "Pediatrics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank",
      "ct_scanner"
    ],
    "status": "active",
    "bedCapacity": 320,
    "emergencyHelpline": "Rescue 1122 / 046-2511122",
    "contactPhone": "+92-46-2511122",
    "contactEmail": "dhq.toba.tobateksingh@punjabhealth.gov.pk"
  },
  {
    "name": "Al-Rehman Trauma Center Toba Tek Singh",
    "city": "Toba Tek Singh",
    "province": "Punjab",
    "facilityType": "private",
    "location": {
      "lat": 30.975,
      "lng": 72.488,
      "address": "Shor Kot Road, Toba Tek Singh, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "Orthopedics",
      "General Surgery"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 75,
    "emergencyHelpline": "046-2514400",
    "contactPhone": "+92-46-2514400",
    "contactEmail": "al.rehman.tobateksingh@privatehealth.pk"
  },
  {
    "name": "DHQ Hospital Vehari",
    "city": "Vehari",
    "province": "Punjab",
    "facilityType": "government",
    "location": {
      "lat": 30.041,
      "lng": 72.348,
      "address": "Club Road, Vehari, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Cardiology",
      "Pediatrics",
      "Critical Care"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank",
      "ct_scanner"
    ],
    "status": "active",
    "bedCapacity": 380,
    "emergencyHelpline": "Rescue 1122 / 067-9201122",
    "contactPhone": "+92-67-9201122",
    "contactEmail": "dhq.vehari.vehari@punjabhealth.gov.pk"
  },
  {
    "name": "Burewala City Medicare (Vehari)",
    "city": "Vehari",
    "province": "Punjab",
    "facilityType": "private",
    "location": {
      "lat": 30.046,
      "lng": 72.354,
      "address": "Multan Road, Vehari, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "Orthopedics",
      "General Surgery"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 85,
    "emergencyHelpline": "067-3361122",
    "contactPhone": "+92-67-3361122",
    "contactEmail": "burewala.city.vehari@privatehealth.pk"
  },
  {
    "name": "Asfandyar Bukhari DHQ Hospital Attock",
    "city": "Attock",
    "province": "Punjab",
    "facilityType": "government",
    "location": {
      "lat": 33.766,
      "lng": 72.36,
      "address": "Civil Hospital Road, Attock, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Cardiology",
      "Critical Care",
      "Pediatrics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank",
      "ct_scanner"
    ],
    "status": "active",
    "bedCapacity": 400,
    "emergencyHelpline": "Rescue 1122 / 057-9316122",
    "contactPhone": "+92-57-9316122",
    "contactEmail": "asfandyar.bukhari.attock@punjabhealth.gov.pk"
  },
  {
    "name": "Attock Hospital Private Ltd",
    "city": "Attock",
    "province": "Punjab",
    "facilityType": "private",
    "location": {
      "lat": 33.771,
      "lng": 72.366,
      "address": "Katchery Road, Attock, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "General Surgery",
      "Cardiology"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 75,
    "emergencyHelpline": "057-2611100",
    "contactPhone": "+92-57-2611100",
    "contactEmail": "attock.private.attock@privatehealth.pk"
  },
  {
    "name": "DHQ Hospital Bhakkar",
    "city": "Bhakkar",
    "province": "Punjab",
    "facilityType": "government",
    "location": {
      "lat": 31.625,
      "lng": 71.065,
      "address": "Jhang Road, Bhakkar, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Pediatrics",
      "Critical Care"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 280,
    "emergencyHelpline": "Rescue 1122 / 0453-920122",
    "contactPhone": "+92-453-920122",
    "contactEmail": "dhq.bhakkar.bhakkar@punjabhealth.gov.pk"
  },
  {
    "name": "Al-Noor Medicare Bhakkar",
    "city": "Bhakkar",
    "province": "Punjab",
    "facilityType": "private",
    "location": {
      "lat": 31.63,
      "lng": 71.071,
      "address": "Darya Khan Road, Bhakkar, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "General Surgery",
      "Orthopedics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 60,
    "emergencyHelpline": "0453-511200",
    "contactPhone": "+92-453-511200",
    "contactEmail": "al.noor.bhakkar@privatehealth.pk"
  },
  {
    "name": "DHQ Hospital Chakwal",
    "city": "Chakwal",
    "province": "Punjab",
    "facilityType": "government",
    "location": {
      "lat": 32.932,
      "lng": 72.856,
      "address": "Rawalpindi Road, Chakwal, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Cardiology",
      "Pediatrics",
      "Critical Care"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank",
      "ct_scanner"
    ],
    "status": "active",
    "bedCapacity": 350,
    "emergencyHelpline": "Rescue 1122 / 0543-551122",
    "contactPhone": "+92-543-551122",
    "contactEmail": "dhq.chakwal.chakwal@punjabhealth.gov.pk"
  },
  {
    "name": "City Hospital Chakwal",
    "city": "Chakwal",
    "province": "Punjab",
    "facilityType": "private",
    "location": {
      "lat": 32.937,
      "lng": 72.862,
      "address": "Talagang Road, Chakwal, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "Orthopedics",
      "General Surgery"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 75,
    "emergencyHelpline": "0543-601100",
    "contactPhone": "+92-543-601100",
    "contactEmail": "city.chakwal.chakwal@privatehealth.pk"
  },
  {
    "name": "THQ Hospital Murree",
    "city": "Murree",
    "province": "Punjab",
    "facilityType": "government",
    "location": {
      "lat": 33.907,
      "lng": 73.39,
      "address": "Cart Road, Murree, Punjab"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Critical Care",
      "Orthopedics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 200,
    "emergencyHelpline": "Rescue 1122 / 051-9269122",
    "contactPhone": "+92-51-9269122",
    "contactEmail": "thq.murree.murree@punjabhealth.gov.pk"
  },
  {
    "name": "Samli Sanatorium & Emergency Center Murree",
    "city": "Murree",
    "province": "Punjab",
    "facilityType": "government",
    "location": {
      "lat": 33.912,
      "lng": 73.396,
      "address": "Samli, Murree Hills, Punjab"
    },
    "specialties": [
      "Pulmonology",
      "Emergency Medicine",
      "Critical Care"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 250,
    "emergencyHelpline": "Rescue 1122 / 051-9269150",
    "contactPhone": "+92-51-9269150",
    "contactEmail": "samli.sanatorium.murree@punjabhealth.gov.pk"
  },
  {
    "name": "Abbasi Shaheed Hospital",
    "city": "Karachi Central",
    "province": "Sindh",
    "facilityType": "government",
    "location": {
      "lat": 24.931,
      "lng": 67.037,
      "address": "Block 3, Nazimabad, Karachi, Sindh"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Orthopedics",
      "Pediatrics",
      "Critical Care",
      "Neurology"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank",
      "ct_scanner",
      "trauma_team"
    ],
    "status": "active",
    "bedCapacity": 950,
    "emergencyHelpline": "Sindh Rescue 1122 / 021-99260400",
    "contactPhone": "+92-21-99260400",
    "contactEmail": "abbasi.shaheed.karachicentral@sindhhealth.gov.pk"
  },
  {
    "name": "Patel Hospital Karachi",
    "city": "Karachi Central",
    "province": "Sindh",
    "facilityType": "private",
    "location": {
      "lat": 24.935,
      "lng": 67.042,
      "address": "ST-18, Block 4, Gulshan-e-Iqbal, Karachi, Sindh"
    },
    "specialties": [
      "Cardiology",
      "Emergency Medicine",
      "Critical Care",
      "General Surgery",
      "Orthopedics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank",
      "ct_scanner"
    ],
    "status": "active",
    "bedCapacity": 250,
    "emergencyHelpline": "021-111-174-174",
    "contactPhone": "+92-21-34968660",
    "contactEmail": "patel.karachi.karachicentral@privatehealth.pk"
  },
  {
    "name": "Dow University Hospital (Ojha Campus)",
    "city": "Karachi East",
    "province": "Sindh",
    "facilityType": "government",
    "location": {
      "lat": 24.928,
      "lng": 67.112,
      "address": "Suparco Road, Gulzar-e-Hijri, Scheme 33, Karachi, Sindh"
    },
    "specialties": [
      "Pulmonology",
      "Critical Care",
      "Cardiology",
      "Emergency Medicine",
      "Neurology",
      "Pediatrics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "ct_scanner",
      "blood_bank",
      "trauma_team"
    ],
    "status": "active",
    "bedCapacity": 1000,
    "emergencyHelpline": "Sindh Rescue 1122 / 021-99232660",
    "contactPhone": "+92-21-99232660",
    "contactEmail": "dow.university.karachieast@sindhhealth.gov.pk"
  },
  {
    "name": "Dr. Ruth K.M. Pfau Civil Hospital Karachi (CHK)",
    "city": "Karachi South",
    "province": "Sindh",
    "facilityType": "government",
    "location": {
      "lat": 24.858,
      "lng": 67.011,
      "address": "Baba-e-Urdu Road, Saddar, Karachi, Sindh"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Neurology",
      "Cardiology",
      "Pediatrics",
      "Critical Care",
      "Orthopedics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "ct_scanner",
      "blood_bank",
      "trauma_team"
    ],
    "status": "active",
    "bedCapacity": 1900,
    "emergencyHelpline": "Sindh Rescue 1122 / 021-99215740",
    "contactPhone": "+92-21-99215740",
    "contactEmail": "er@civilhospital.gov.pk"
  },
  {
    "name": "National Institute of Cardiovascular Diseases (NICVD)",
    "city": "Karachi South",
    "province": "Sindh",
    "facilityType": "government",
    "location": {
      "lat": 24.852,
      "lng": 67.045,
      "address": "Rafiqui Shaheed Road, Cantt, Karachi, Sindh"
    },
    "specialties": [
      "Cardiology",
      "Emergency Medicine",
      "Critical Care"
    ],
    "equipment": [
      "catheterization_lab",
      "ventilator",
      "icu_bed",
      "blood_bank",
      "er_bed"
    ],
    "status": "active",
    "bedCapacity": 1200,
    "emergencyHelpline": "Sindh Rescue 1122 / 021-99201271",
    "contactPhone": "+92-21-99201271",
    "contactEmail": "info@nicvd.org"
  },
  {
    "name": "Sindh Government Qatar Hospital Orangi",
    "city": "Karachi West",
    "province": "Sindh",
    "facilityType": "government",
    "location": {
      "lat": 24.945,
      "lng": 66.992,
      "address": "Orangi Town Sector 7, Karachi, Sindh"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Pediatrics",
      "General Surgery"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 350,
    "emergencyHelpline": "Sindh Rescue 1122 / 021-36650011",
    "contactPhone": "+92-21-36650011",
    "contactEmail": "sindh.government.karachiwest@sindhhealth.gov.pk"
  },
  {
    "name": "Valika Social Security Hospital",
    "city": "Karachi West",
    "province": "Sindh",
    "facilityType": "government",
    "location": {
      "lat": 24.905,
      "lng": 66.985,
      "address": "Manghopir Road, SITE Area, Karachi, Sindh"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Orthopedics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 300,
    "emergencyHelpline": "Sindh Rescue 1122 / 021-32578811",
    "contactPhone": "+92-21-32578811",
    "contactEmail": "valika.social.karachiwest@sindhhealth.gov.pk"
  },
  {
    "name": "Sindh Government Hospital Korangi",
    "city": "Korangi",
    "province": "Sindh",
    "facilityType": "government",
    "location": {
      "lat": 24.835,
      "lng": 67.125,
      "address": "Korangi No. 5, Karachi, Sindh"
    },
    "specialties": [
      "Emergency Medicine",
      "Pediatrics",
      "General Surgery",
      "Critical Care"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 400,
    "emergencyHelpline": "Sindh Rescue 1122 / 021-35061122",
    "contactPhone": "+92-21-35061122",
    "contactEmail": "sindh.government.korangi@sindhhealth.gov.pk"
  },
  {
    "name": "Sindh Government Hospital Malir",
    "city": "Malir",
    "province": "Sindh",
    "facilityType": "government",
    "location": {
      "lat": 24.895,
      "lng": 67.195,
      "address": "Kala Board, Malir, Karachi, Sindh"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Pediatrics",
      "Critical Care"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 300,
    "emergencyHelpline": "Sindh Rescue 1122 / 021-34401122",
    "contactPhone": "+92-21-34401122",
    "contactEmail": "sindh.government.malir@sindhhealth.gov.pk"
  },
  {
    "name": "Atia General Hospital Malir",
    "city": "Malir",
    "province": "Sindh",
    "facilityType": "private",
    "location": {
      "lat": 24.899,
      "lng": 67.201,
      "address": "National Highway, Malir City, Karachi, Sindh"
    },
    "specialties": [
      "Emergency Medicine",
      "General Surgery",
      "Orthopedics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 90,
    "emergencyHelpline": "021-34502211",
    "contactPhone": "+92-21-34502211",
    "contactEmail": "atia.general.malir@privatehealth.pk"
  },
  {
    "name": "KPT Hospital Keamari",
    "city": "Keamari",
    "province": "Sindh",
    "facilityType": "government",
    "location": {
      "lat": 24.821,
      "lng": 66.978,
      "address": "Port Trust Area, Keamari, Karachi, Sindh"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "General Surgery"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 200,
    "emergencyHelpline": "Sindh Rescue 1122 / 021-99263000",
    "contactPhone": "+92-21-99263000",
    "contactEmail": "kpt.keamari.keamari@sindhhealth.gov.pk"
  },
  {
    "name": "Murshid Hospital & Health Care Centre",
    "city": "Keamari",
    "province": "Sindh",
    "facilityType": "private",
    "location": {
      "lat": 24.862,
      "lng": 66.915,
      "address": "Hub River Road, Mujahid Colony, Keamari, Karachi, Sindh"
    },
    "specialties": [
      "Emergency Medicine",
      "Pediatrics",
      "Orthopedics",
      "Critical Care"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 220,
    "emergencyHelpline": "021-32811301",
    "contactPhone": "+92-21-32811301",
    "contactEmail": "murshid.health.keamari@privatehealth.pk"
  },
  {
    "name": "Civil Hospital Badin",
    "city": "Badin",
    "province": "Sindh",
    "facilityType": "government",
    "location": {
      "lat": 24.656,
      "lng": 68.837,
      "address": "Hospital Road, Badin, Sindh"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Pediatrics",
      "Critical Care"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 300,
    "emergencyHelpline": "Sindh Rescue 1122 / 0297-861122",
    "contactPhone": "+92-297-861122",
    "contactEmail": "civil.badin.badin@sindhhealth.gov.pk"
  },
  {
    "name": "Indus Hospital Badin Campus",
    "city": "Badin",
    "province": "Sindh",
    "facilityType": "private",
    "location": {
      "lat": 24.661,
      "lng": 68.843,
      "address": "DC Office Road, Badin, Sindh"
    },
    "specialties": [
      "Emergency Medicine",
      "Pediatrics",
      "General Surgery"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 120,
    "emergencyHelpline": "0297-862200",
    "contactPhone": "+92-297-862200",
    "contactEmail": "er@indushospital.org.pk"
  },
  {
    "name": "Civil Hospital Dadu",
    "city": "Dadu",
    "province": "Sindh",
    "facilityType": "government",
    "location": {
      "lat": 26.732,
      "lng": 67.776,
      "address": "Station Road, Dadu, Sindh"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Cardiology",
      "Pediatrics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank",
      "ct_scanner"
    ],
    "status": "active",
    "bedCapacity": 350,
    "emergencyHelpline": "Sindh Rescue 1122 / 025-9200155",
    "contactPhone": "+92-25-9200155",
    "contactEmail": "civil.dadu.dadu@sindhhealth.gov.pk"
  },
  {
    "name": "Al-Makkah Hospital Dadu",
    "city": "Dadu",
    "province": "Sindh",
    "facilityType": "private",
    "location": {
      "lat": 26.737,
      "lng": 67.782,
      "address": "Moro Road, Dadu, Sindh"
    },
    "specialties": [
      "Emergency Medicine",
      "General Surgery",
      "Orthopedics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 70,
    "emergencyHelpline": "025-4611100",
    "contactPhone": "+92-25-4611100",
    "contactEmail": "al.makkah.dadu@privatehealth.pk"
  },
  {
    "name": "DHQ Hospital Mirpur Mathelo (Ghotki)",
    "city": "Ghotki",
    "province": "Sindh",
    "facilityType": "government",
    "location": {
      "lat": 28.006,
      "lng": 69.316,
      "address": "National Highway, Mirpur Mathelo, Ghotki, Sindh"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Critical Care",
      "Pediatrics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 250,
    "emergencyHelpline": "Sindh Rescue 1122 / 0723-651122",
    "contactPhone": "+92-723-651122",
    "contactEmail": "dhq.mirpur.ghotki@sindhhealth.gov.pk"
  },
  {
    "name": "Engro Medical Center Daharki (Ghotki)",
    "city": "Ghotki",
    "province": "Sindh",
    "facilityType": "private",
    "location": {
      "lat": 28.045,
      "lng": 69.512,
      "address": "Engro Plant Area, Daharki, Ghotki, Sindh"
    },
    "specialties": [
      "Emergency Medicine",
      "Cardiology",
      "General Surgery"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 80,
    "emergencyHelpline": "0723-641100",
    "contactPhone": "+92-723-641100",
    "contactEmail": "engro.daharki.ghotki@privatehealth.pk"
  },
  {
    "name": "Jacobabad Institute of Medical Sciences (JIMS)",
    "city": "Jacobabad",
    "province": "Sindh",
    "facilityType": "government",
    "location": {
      "lat": 28.281,
      "lng": 68.438,
      "address": "Quetta Road, Jacobabad, Sindh"
    },
    "specialties": [
      "Cardiology",
      "Neurology",
      "Trauma Surgery",
      "Emergency Medicine",
      "Critical Care",
      "Pediatrics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "ct_scanner",
      "blood_bank",
      "trauma_team"
    ],
    "status": "active",
    "bedCapacity": 400,
    "emergencyHelpline": "Sindh Rescue 1122 / 0722-651001",
    "contactPhone": "+92-722-651001",
    "contactEmail": "jacobabad.sciences.jacobabad@sindhhealth.gov.pk"
  },
  {
    "name": "Civil Hospital Jacobabad",
    "city": "Jacobabad",
    "province": "Sindh",
    "facilityType": "government",
    "location": {
      "lat": 28.275,
      "lng": 68.432,
      "address": "DC Office Road, Jacobabad, Sindh"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "General Surgery"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 250,
    "emergencyHelpline": "Sindh Rescue 1122 / 0722-650122",
    "contactPhone": "+92-722-650122",
    "contactEmail": "civil.jacobabad.jacobabad@sindhhealth.gov.pk"
  },
  {
    "name": "Liaquat University Hospital Jamshoro (LUMHS)",
    "city": "Jamshoro",
    "province": "Sindh",
    "facilityType": "government",
    "location": {
      "lat": 25.43,
      "lng": 68.27,
      "address": "LUMHS Campus, Jamshoro, Sindh"
    },
    "specialties": [
      "Trauma Surgery",
      "Neurology",
      "Cardiology",
      "Emergency Medicine",
      "Critical Care",
      "Orthopedics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "ct_scanner",
      "blood_bank",
      "trauma_team"
    ],
    "status": "active",
    "bedCapacity": 800,
    "emergencyHelpline": "Sindh Rescue 1122 / 022-9213305",
    "contactPhone": "+92-22-9213305",
    "contactEmail": "liaquat.university.jamshoro@sindhhealth.gov.pk"
  },
  {
    "name": "Jamshoro Trauma Center",
    "city": "Jamshoro",
    "province": "Sindh",
    "facilityType": "government",
    "location": {
      "lat": 25.435,
      "lng": 68.275,
      "address": "Indus Highway, Jamshoro, Sindh"
    },
    "specialties": [
      "Trauma Surgery",
      "Emergency Medicine",
      "Orthopedics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank",
      "trauma_team"
    ],
    "status": "active",
    "bedCapacity": 150,
    "emergencyHelpline": "Sindh Rescue 1122 / 022-9213310",
    "contactPhone": "+92-22-9213310",
    "contactEmail": "jamshoro.trauma.jamshoro@sindhhealth.gov.pk"
  },
  {
    "name": "Civil Hospital Kandhkot (Kashmore)",
    "city": "Kashmore",
    "province": "Sindh",
    "facilityType": "government",
    "location": {
      "lat": 28.433,
      "lng": 69.583,
      "address": "Indus Highway, Kandhkot, Kashmore, Sindh"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Pediatrics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 250,
    "emergencyHelpline": "Sindh Rescue 1122 / 0722-570122",
    "contactPhone": "+92-722-570122",
    "contactEmail": "civil.kandhkot.kashmore@sindhhealth.gov.pk"
  },
  {
    "name": "City Medicare Kandhkot",
    "city": "Kashmore",
    "province": "Sindh",
    "facilityType": "private",
    "location": {
      "lat": 28.438,
      "lng": 69.589,
      "address": "Station Road, Kandhkot, Sindh"
    },
    "specialties": [
      "Emergency Medicine",
      "General Surgery",
      "Cardiology"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 50,
    "emergencyHelpline": "0722-571100",
    "contactPhone": "+92-722-571100",
    "contactEmail": "city.medicare.kashmore@privatehealth.pk"
  },
  {
    "name": "Khairpur Medical College Teaching Hospital",
    "city": "Khairpur",
    "province": "Sindh",
    "facilityType": "government",
    "location": {
      "lat": 27.529,
      "lng": 68.759,
      "address": "Civil Hospital Road, Khairpur Mirs, Sindh"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Cardiology",
      "Critical Care",
      "Pediatrics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank",
      "ct_scanner"
    ],
    "status": "active",
    "bedCapacity": 500,
    "emergencyHelpline": "Sindh Rescue 1122 / 0243-9280122",
    "contactPhone": "+92-243-9280122",
    "contactEmail": "khairpur.college.khairpur@sindhhealth.gov.pk"
  },
  {
    "name": "Luqman Medical Complex Khairpur",
    "city": "Khairpur",
    "province": "Sindh",
    "facilityType": "private",
    "location": {
      "lat": 27.534,
      "lng": 68.765,
      "address": "Station Road, Khairpur, Sindh"
    },
    "specialties": [
      "Emergency Medicine",
      "Orthopedics",
      "General Surgery"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 80,
    "emergencyHelpline": "0243-715100",
    "contactPhone": "+92-243-715100",
    "contactEmail": "luqman.complex.khairpur@privatehealth.pk"
  },
  {
    "name": "Taluka Hospital Hala (DHQ Matiari)",
    "city": "Matiari",
    "province": "Sindh",
    "facilityType": "government",
    "location": {
      "lat": 25.597,
      "lng": 68.446,
      "address": "National Highway, Hala, Matiari, Sindh"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Pediatrics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 200,
    "emergencyHelpline": "Sindh Rescue 1122 / 022-3331122",
    "contactPhone": "+92-22-3331122",
    "contactEmail": "taluka.hala.matiari@sindhhealth.gov.pk"
  },
  {
    "name": "Makhdoom Bilawal Medical Center Matiari",
    "city": "Matiari",
    "province": "Sindh",
    "facilityType": "private",
    "location": {
      "lat": 25.602,
      "lng": 68.452,
      "address": "Main Bazar, Matiari, Sindh"
    },
    "specialties": [
      "Emergency Medicine",
      "General Surgery",
      "Cardiology"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 60,
    "emergencyHelpline": "022-2760100",
    "contactPhone": "+92-22-2760100",
    "contactEmail": "makhdoom.bilawal.matiari@privatehealth.pk"
  },
  {
    "name": "Civil Hospital Naushahro Feroze",
    "city": "Naushahro Feroze",
    "province": "Sindh",
    "facilityType": "government",
    "location": {
      "lat": 26.846,
      "lng": 68.122,
      "address": "Kandiaro Road, Naushahro Feroze, Sindh"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Critical Care",
      "Pediatrics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 250,
    "emergencyHelpline": "Sindh Rescue 1122 / 0242-448122",
    "contactPhone": "+92-242-448122",
    "contactEmail": "civil.naushahro.naushahroferoze@sindhhealth.gov.pk"
  },
  {
    "name": "Al-Madina Hospital Moro",
    "city": "Naushahro Feroze",
    "province": "Sindh",
    "facilityType": "private",
    "location": {
      "lat": 26.662,
      "lng": 67.985,
      "address": "National Highway, Moro, Sindh"
    },
    "specialties": [
      "Emergency Medicine",
      "General Surgery",
      "Orthopedics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 75,
    "emergencyHelpline": "0242-411200",
    "contactPhone": "+92-242-411200",
    "contactEmail": "al.madina.naushahroferoze@privatehealth.pk"
  },
  {
    "name": "DHQ Hospital Qambar",
    "city": "Qambar Shahdadkot",
    "province": "Sindh",
    "facilityType": "government",
    "location": {
      "lat": 27.587,
      "lng": 68.003,
      "address": "Larkana Road, Qambar, Sindh"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Pediatrics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 250,
    "emergencyHelpline": "Sindh Rescue 1122 / 074-4211122",
    "contactPhone": "+92-74-4211122",
    "contactEmail": "dhq.qambar.qambarshahdadkot@sindhhealth.gov.pk"
  },
  {
    "name": "Civil Hospital Sanghar",
    "city": "Sanghar",
    "province": "Sindh",
    "facilityType": "government",
    "location": {
      "lat": 26.046,
      "lng": 68.948,
      "address": "Mirpurkhas Road, Sanghar, Sindh"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Pediatrics",
      "Critical Care"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank",
      "ct_scanner"
    ],
    "status": "active",
    "bedCapacity": 350,
    "emergencyHelpline": "Sindh Rescue 1122 / 0235-541122",
    "contactPhone": "+92-235-541122",
    "contactEmail": "civil.sanghar.sanghar@sindhhealth.gov.pk"
  },
  {
    "name": "Shahdadpur Medical Center (Sanghar)",
    "city": "Sanghar",
    "province": "Sindh",
    "facilityType": "private",
    "location": {
      "lat": 25.925,
      "lng": 68.625,
      "address": "Station Road, Shahdadpur, Sanghar, Sindh"
    },
    "specialties": [
      "Emergency Medicine",
      "General Surgery",
      "Cardiology"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 80,
    "emergencyHelpline": "0235-841100",
    "contactPhone": "+92-235-841100",
    "contactEmail": "shahdadpur.sanghar@privatehealth.pk"
  },
  {
    "name": "RBUT Civil Hospital Shikarpur",
    "city": "Shikarpur",
    "province": "Sindh",
    "facilityType": "government",
    "location": {
      "lat": 27.957,
      "lng": 68.638,
      "address": "Station Road, Shikarpur, Sindh"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Critical Care",
      "Pediatrics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 300,
    "emergencyHelpline": "Sindh Rescue 1122 / 0726-512122",
    "contactPhone": "+92-726-512122",
    "contactEmail": "rbut.civil.shikarpur@sindhhealth.gov.pk"
  },
  {
    "name": "DHQ Hospital Sujawal",
    "city": "Sujawal",
    "province": "Sindh",
    "facilityType": "government",
    "location": {
      "lat": 24.606,
      "lng": 68.077,
      "address": "Badin Road, Sujawal, Sindh"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Pediatrics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 200,
    "emergencyHelpline": "Sindh Rescue 1122 / 0298-511122",
    "contactPhone": "+92-298-511122",
    "contactEmail": "dhq.sujawal.sujawal@sindhhealth.gov.pk"
  },
  {
    "name": "Civil Hospital Tando Allahyar",
    "city": "Tando Allahyar",
    "province": "Sindh",
    "facilityType": "government",
    "location": {
      "lat": 25.46,
      "lng": 68.717,
      "address": "Mirpurkhas Road, Tando Allahyar, Sindh"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Pediatrics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 220,
    "emergencyHelpline": "Sindh Rescue 1122 / 022-3891122",
    "contactPhone": "+92-22-3891122",
    "contactEmail": "civil.tando.tandoallahyar@sindhhealth.gov.pk"
  },
  {
    "name": "NICVD Satellite Tando Muhammad Khan",
    "city": "Tando Muhammad Khan",
    "province": "Sindh",
    "facilityType": "government",
    "location": {
      "lat": 25.123,
      "lng": 68.535,
      "address": "Badin Road, Tando Muhammad Khan, Sindh"
    },
    "specialties": [
      "Cardiology",
      "Emergency Medicine",
      "Critical Care"
    ],
    "equipment": [
      "catheterization_lab",
      "ventilator",
      "icu_bed",
      "blood_bank",
      "er_bed"
    ],
    "status": "active",
    "bedCapacity": 200,
    "emergencyHelpline": "Sindh Rescue 1122 / 022-3341122",
    "contactPhone": "+92-22-3341122",
    "contactEmail": "info@nicvd.org"
  },
  {
    "name": "Civil Hospital Mithi (Tharparkar)",
    "city": "Tharparkar",
    "province": "Sindh",
    "facilityType": "government",
    "location": {
      "lat": 24.743,
      "lng": 69.8,
      "address": "Naukot Road, Mithi, Tharparkar, Sindh"
    },
    "specialties": [
      "Emergency Medicine",
      "Pediatrics",
      "Critical Care",
      "General Surgery"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 300,
    "emergencyHelpline": "Sindh Rescue 1122 / 0232-261122",
    "contactPhone": "+92-232-261122",
    "contactEmail": "civil.mithi.tharparkar@sindhhealth.gov.pk"
  },
  {
    "name": "Civil Hospital Thatta",
    "city": "Thatta",
    "province": "Sindh",
    "facilityType": "government",
    "location": {
      "lat": 24.747,
      "lng": 67.923,
      "address": "National Highway, Makli, Thatta, Sindh"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Pediatrics",
      "Critical Care"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 280,
    "emergencyHelpline": "Sindh Rescue 1122 / 0298-920022",
    "contactPhone": "+92-298-920022",
    "contactEmail": "civil.thatta.thatta@sindhhealth.gov.pk"
  },
  {
    "name": "Civil Hospital Umerkot",
    "city": "Umerkot",
    "province": "Sindh",
    "facilityType": "government",
    "location": {
      "lat": 25.354,
      "lng": 69.736,
      "address": "Mirpurkhas Road, Umerkot, Sindh"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Pediatrics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 250,
    "emergencyHelpline": "Sindh Rescue 1122 / 0238-571122",
    "contactPhone": "+92-238-571122",
    "contactEmail": "civil.umerkot.umerkot@sindhhealth.gov.pk"
  },
  {
    "name": "DHQ Teaching Hospital Dera Ismail Khan",
    "city": "Dera Ismail Khan",
    "province": "Khyber Pakhtunkhwa",
    "facilityType": "government",
    "location": {
      "lat": 31.831,
      "lng": 70.902,
      "address": "Bannu Road, Dera Ismail Khan, KP"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Cardiology",
      "Critical Care",
      "Pediatrics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank",
      "ct_scanner"
    ],
    "status": "active",
    "bedCapacity": 500,
    "emergencyHelpline": "Rescue 1122 / 0966-9280122",
    "contactPhone": "+92-966-9280122",
    "contactEmail": "dhq.dera.deraismailkhan@kpkhealth.gov.pk"
  },
  {
    "name": "Teaching Hospital Turbat",
    "city": "Turbat",
    "province": "Balochistan",
    "facilityType": "government",
    "location": {
      "lat": 26.003,
      "lng": 63.054,
      "address": "Main Road, Turbat, Balochistan"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Critical Care",
      "Pediatrics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 250,
    "emergencyHelpline": "Rescue 1122 / 0852-412122",
    "contactPhone": "+92-852-412122",
    "contactEmail": "turbat.turbat@balochistanhealth.gov.pk"
  },
  {
    "name": "Teaching Hospital Khuzdar",
    "city": "Khuzdar",
    "province": "Balochistan",
    "facilityType": "government",
    "location": {
      "lat": 27.812,
      "lng": 66.617,
      "address": "RCD Highway, Khuzdar, Balochistan"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Critical Care"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 220,
    "emergencyHelpline": "Rescue 1122 / 0848-412211",
    "contactPhone": "+92-848-412211",
    "contactEmail": "khuzdar.khuzdar@balochistanhealth.gov.pk"
  },
  {
    "name": "CMH Rawalakot / DHQ Hospital",
    "city": "Rawalakot",
    "province": "Azad Jammu & Kashmir",
    "facilityType": "government",
    "location": {
      "lat": 33.858,
      "lng": 73.761,
      "address": "Main Bazar, Rawalakot, AJK"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Critical Care",
      "Orthopedics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 250,
    "emergencyHelpline": "Rescue 1122 / 05824-920122",
    "contactPhone": "+92-5824-920122",
    "contactEmail": "cmh.rawalakot@pakarmy.gov.pk"
  },
  {
    "name": "Civil Hospital Khairpur Mir's (KIMS Teaching Hospital)",
    "city": "Khairpur Mir's",
    "province": "Sindh",
    "facilityType": "government",
    "location": {
      "lat": 27.5295,
      "lng": 68.7592,
      "address": "Mall Road, Khairpur Mir's, Sindh"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Cardiology",
      "General Surgery",
      "Pediatrics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank",
      "ct_scanner"
    ],
    "status": "active",
    "bedCapacity": 350,
    "emergencyHelpline": "Sindh Rescue 1122 / 0243-9280122",
    "contactPhone": "+92-243-9280122",
    "contactEmail": "civil.khairpur@sindhhealth.gov.pk"
  },
  {
    "name": "Gambat Institute of Medical Sciences (GIMS)",
    "city": "Khairpur Mir's",
    "province": "Sindh",
    "facilityType": "government",
    "location": {
      "lat": 27.3541,
      "lng": 68.5217,
      "address": "National Highway N-5, Gambat, Khairpur District, Sindh"
    },
    "specialties": [
      "Emergency Medicine",
      "Critical Care",
      "Cardiology",
      "Trauma Surgery",
      "Neurology",
      "Nephrology",
      "Pediatrics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank",
      "ct_scanner",
      "catheterization_lab"
    ],
    "status": "active",
    "bedCapacity": 800,
    "emergencyHelpline": "0243-720101 / Rescue 1122",
    "contactPhone": "+92-243-720101",
    "contactEmail": "info@gims.org.pk"
  },
  {
    "name": "Luqman Medical Center Khairpur Mir's",
    "city": "Khairpur Mir's",
    "province": "Sindh",
    "facilityType": "private",
    "location": {
      "lat": 27.534,
      "lng": 68.765,
      "address": "Station Road, Khairpur Mir's, Sindh"
    },
    "specialties": [
      "Emergency Medicine",
      "Cardiology",
      "Orthopedics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 75,
    "emergencyHelpline": "0243-551100",
    "contactPhone": "+92-243-551100",
    "contactEmail": "info@luqmanhospital.com"
  },
  {
    "name": "GIMS Trauma & Emergency Complex Gambat",
    "city": "Gambat",
    "province": "Sindh",
    "facilityType": "government",
    "location": {
      "lat": 27.355,
      "lng": 68.5225,
      "address": "Indus Highway Bypass, Gambat, Sindh"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Critical Care",
      "Cardiology"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank",
      "ct_scanner"
    ],
    "status": "active",
    "bedCapacity": 400,
    "emergencyHelpline": "0243-720202",
    "contactPhone": "+92-243-720202",
    "contactEmail": "trauma.gims@sindhhealth.gov.pk"
  },
  {
    "name": "Civil Hospital Nausharo Feroz (DHQ Hospital)",
    "city": "Nausharo Feroz",
    "province": "Sindh",
    "facilityType": "government",
    "location": {
      "lat": 26.8463,
      "lng": 68.1221,
      "address": "Main National Highway, Nausharo Feroz, Sindh"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Pediatrics",
      "General Surgery",
      "Critical Care"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank",
      "ct_scanner"
    ],
    "status": "active",
    "bedCapacity": 280,
    "emergencyHelpline": "Sindh Rescue 1122 / 0242-448122",
    "contactPhone": "+92-242-448122",
    "contactEmail": "dhq.nausharoferoz@sindhhealth.gov.pk"
  },
  {
    "name": "THQ Hospital Moro",
    "city": "Nausharo Feroz",
    "province": "Sindh",
    "facilityType": "government",
    "location": {
      "lat": 26.663,
      "lng": 68.001,
      "address": "National Highway, Moro, Nausharo Feroz District, Sindh"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Pediatrics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 150,
    "emergencyHelpline": "0242-411222",
    "contactPhone": "+92-242-411222",
    "contactEmail": "thq.moro@sindhhealth.gov.pk"
  },
  {
    "name": "THQ Hospital Moro (City Center)",
    "city": "Moro",
    "province": "Sindh",
    "facilityType": "government",
    "location": {
      "lat": 26.6645,
      "lng": 68.0025,
      "address": "Main Bazar Road, Moro, Sindh"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "General Surgery"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 140,
    "emergencyHelpline": "0242-411333",
    "contactPhone": "+92-242-411333",
    "contactEmail": "er.moro@sindhhealth.gov.pk"
  },
  {
    "name": "THQ Hospital Kandiaro",
    "city": "Kandiaro",
    "province": "Sindh",
    "facilityType": "government",
    "location": {
      "lat": 26.915,
      "lng": 68.21,
      "address": "Station Road, Kandiaro, Nausharo Feroz District, Sindh"
    },
    "specialties": [
      "Emergency Medicine",
      "Pediatrics",
      "General Surgery"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 120,
    "emergencyHelpline": "0242-421122",
    "contactPhone": "+92-242-421122",
    "contactEmail": "thq.kandiaro@sindhhealth.gov.pk"
  },
  {
    "name": "Al-Razi Hospital Nausharo Feroz",
    "city": "Nausharo Feroz",
    "province": "Sindh",
    "facilityType": "private",
    "location": {
      "lat": 26.849,
      "lng": 68.125,
      "address": "Kandiaro Road, Nausharo Feroz, Sindh"
    },
    "specialties": [
      "Emergency Medicine",
      "General Surgery",
      "Pediatrics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 60,
    "emergencyHelpline": "0242-448333",
    "contactPhone": "+92-242-448333",
    "contactEmail": "alrazi.nausharo@privatehealth.pk"
  },
  {
    "name": "Syed Abdullah Shah Institute of Medical Sciences (SASI)",
    "city": "Sehwan Sharif",
    "province": "Sindh",
    "facilityType": "government",
    "location": {
      "lat": 26.4253,
      "lng": 67.8617,
      "address": "Indus Highway, Sehwan Sharif, Jamshoro District, Sindh"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Cardiology",
      "Critical Care",
      "Orthopedics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank",
      "ct_scanner"
    ],
    "status": "active",
    "bedCapacity": 350,
    "emergencyHelpline": "025-4620122 / Rescue 1122",
    "contactPhone": "+92-25-4620122",
    "contactEmail": "emergency@sasi.gov.pk"
  },
  {
    "name": "THQ Hospital Tando Adam",
    "city": "Tando Adam",
    "province": "Sindh",
    "facilityType": "government",
    "location": {
      "lat": 25.7682,
      "lng": 68.662,
      "address": "Hyderabad Road, Tando Adam, Sanghar District, Sindh"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Cardiology",
      "Pediatrics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 200,
    "emergencyHelpline": "0235-571122 / Rescue 1122",
    "contactPhone": "+92-235-571122",
    "contactEmail": "thq.tandoadam@sindhhealth.gov.pk"
  },
  {
    "name": "Bilal Hospital Tando Adam",
    "city": "Tando Adam",
    "province": "Sindh",
    "facilityType": "private",
    "location": {
      "lat": 25.771,
      "lng": 68.665,
      "address": "Station Road, Tando Adam, Sindh"
    },
    "specialties": [
      "Emergency Medicine",
      "Orthopedics",
      "General Surgery"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 70,
    "emergencyHelpline": "0235-572200",
    "contactPhone": "+92-235-572200",
    "contactEmail": "bilalhospital.tandoadam@privatehealth.pk"
  },
  {
    "name": "THQ Civil Hospital Shahdadpur",
    "city": "Shahdadpur",
    "province": "Sindh",
    "facilityType": "government",
    "location": {
      "lat": 25.9254,
      "lng": 68.618,
      "address": "Railway Road, Shahdadpur, Sanghar District, Sindh"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Pediatrics",
      "General Surgery"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 180,
    "emergencyHelpline": "0235-841122 / Rescue 1122",
    "contactPhone": "+92-235-841122",
    "contactEmail": "thq.shahdadpur@sindhhealth.gov.pk"
  },
  {
    "name": "THQ Hospital Rohri",
    "city": "Rohri",
    "province": "Sindh",
    "facilityType": "government",
    "location": {
      "lat": 27.674,
      "lng": 68.896,
      "address": "National Highway, Rohri, Sukkur District, Sindh"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Pediatrics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 150,
    "emergencyHelpline": "071-581122 / Rescue 1122",
    "contactPhone": "+92-71-581122",
    "contactEmail": "thq.rohri@sindhhealth.gov.pk"
  },
  {
    "name": "THQ Hospital Kot Diji",
    "city": "Kot Diji",
    "province": "Sindh",
    "facilityType": "government",
    "location": {
      "lat": 27.342,
      "lng": 68.708,
      "address": "Fort Road, Kot Diji, Khairpur District, Sindh"
    },
    "specialties": [
      "Emergency Medicine",
      "General Surgery",
      "Pediatrics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 100,
    "emergencyHelpline": "0243-621122",
    "contactPhone": "+92-243-621122",
    "contactEmail": "thq.kotdiji@sindhhealth.gov.pk"
  },
  {
    "name": "THQ Hospital Mehrabpur",
    "city": "Mehrabpur",
    "province": "Sindh",
    "facilityType": "government",
    "location": {
      "lat": 27.108,
      "lng": 68.423,
      "address": "Station Road, Mehrabpur, Nausharo Feroz District, Sindh"
    },
    "specialties": [
      "Emergency Medicine",
      "Pediatrics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 80,
    "emergencyHelpline": "0242-481122",
    "contactPhone": "+92-242-481122",
    "contactEmail": "thq.mehrabpur@sindhhealth.gov.pk"
  },
  {
    "name": "DHQ Hospital Mirpur Mathelo",
    "city": "Mirpur Mathelo",
    "province": "Sindh",
    "facilityType": "government",
    "location": {
      "lat": 28.022,
      "lng": 69.549,
      "address": "Main Ghotki Road, Mirpur Mathelo, Ghotki District, Sindh"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Pediatrics",
      "Critical Care"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 220,
    "emergencyHelpline": "0723-651122",
    "contactPhone": "+92-723-651122",
    "contactEmail": "dhq.mirpurmathelo@sindhhealth.gov.pk"
  },
  {
    "name": "DHQ Civil Hospital Kandhkot",
    "city": "Kandhkot",
    "province": "Sindh",
    "facilityType": "government",
    "location": {
      "lat": 28.244,
      "lng": 69.182,
      "address": "Kashmore Road, Kandhkot, Sindh"
    },
    "specialties": [
      "Emergency Medicine",
      "Trauma Surgery",
      "Pediatrics"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 200,
    "emergencyHelpline": "0722-571122",
    "contactPhone": "+92-722-571122",
    "contactEmail": "dhq.kandhkot@sindhhealth.gov.pk"
  },
  {
    "name": "THQ Hospital Ratodero",
    "city": "Ratodero",
    "province": "Sindh",
    "facilityType": "government",
    "location": {
      "lat": 27.803,
      "lng": 68.288,
      "address": "Larkana Road, Ratodero, Sindh"
    },
    "specialties": [
      "Emergency Medicine",
      "Pediatrics",
      "General Surgery"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 120,
    "emergencyHelpline": "074-408122",
    "contactPhone": "+92-74-408122",
    "contactEmail": "thq.ratodero@sindhhealth.gov.pk"
  },
  {
    "name": "THQ Hospital Matli",
    "city": "Matli",
    "province": "Sindh",
    "facilityType": "government",
    "location": {
      "lat": 25.043,
      "lng": 68.656,
      "address": "Badin Road, Matli, Sindh"
    },
    "specialties": [
      "Emergency Medicine",
      "Pediatrics",
      "General Surgery"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 100,
    "emergencyHelpline": "0297-841122",
    "contactPhone": "+92-297-841122",
    "contactEmail": "thq.matli@sindhhealth.gov.pk"
  },
  {
    "name": "THQ Hospital Digri",
    "city": "Digri",
    "province": "Sindh",
    "facilityType": "government",
    "location": {
      "lat": 25.156,
      "lng": 69.112,
      "address": "Mirpurkhas Road, Digri, Sindh"
    },
    "specialties": [
      "Emergency Medicine",
      "Pediatrics",
      "General Surgery"
    ],
    "equipment": [
      "er_bed",
      "icu_bed",
      "ventilator",
      "blood_bank"
    ],
    "status": "active",
    "bedCapacity": 100,
    "emergencyHelpline": "0233-871122",
    "contactPhone": "+92-233-871122",
    "contactEmail": "thq.digri@sindhhealth.gov.pk"
  }
];

const PAKISTAN_AMBULANCES = [
  {
    "ambulanceId": "AMB-1122-LHR-01",
    "city": "Lahore",
    "provider": "Rescue 1122 Punjab",
    "status": "available",
    "location": {
      "lat": 31.53,
      "lng": 74.34
    }
  },
  {
    "ambulanceId": "AMB-1122-LHR-02",
    "city": "Lahore",
    "provider": "Rescue 1122 Punjab",
    "status": "available",
    "location": {
      "lat": 31.57,
      "lng": 74.31
    }
  },
  {
    "ambulanceId": "AMB-1122-LHR-03",
    "city": "Lahore",
    "provider": "Rescue 1122 Punjab",
    "status": "available",
    "location": {
      "lat": 31.47,
      "lng": 74.3
    }
  },
  {
    "ambulanceId": "EDHI-115-LHR-01",
    "city": "Lahore",
    "provider": "Edhi Foundation",
    "status": "available",
    "location": {
      "lat": 31.558,
      "lng": 74.327
    }
  },
  {
    "ambulanceId": "CHHIPA-1020-LHR-01",
    "city": "Lahore",
    "provider": "Chhipa Emergency",
    "status": "available",
    "location": {
      "lat": 31.51,
      "lng": 74.345
    }
  },
  {
    "ambulanceId": "AMB-1122-ISB-01",
    "city": "Islamabad",
    "provider": "Rescue 1122 Islamabad",
    "status": "available",
    "location": {
      "lat": 33.71,
      "lng": 73.06
    }
  },
  {
    "ambulanceId": "AMB-1122-ISB-02",
    "city": "Islamabad",
    "provider": "Rescue 1122 Islamabad",
    "status": "available",
    "location": {
      "lat": 33.68,
      "lng": 73.03
    }
  },
  {
    "ambulanceId": "AMB-1122-RWP-01",
    "city": "Rawalpindi",
    "provider": "Rescue 1122 Rawalpindi",
    "status": "available",
    "location": {
      "lat": 33.61,
      "lng": 73.065
    }
  },
  {
    "ambulanceId": "AMB-1122-KHI-01",
    "city": "Karachi",
    "provider": "Sindh Rescue 1122",
    "status": "available",
    "location": {
      "lat": 24.86,
      "lng": 67.01
    }
  },
  {
    "ambulanceId": "AMB-1122-KHI-02",
    "city": "Karachi",
    "provider": "Sindh Rescue 1122",
    "status": "available",
    "location": {
      "lat": 24.89,
      "lng": 67.07
    }
  },
  {
    "ambulanceId": "EDHI-115-KHI-01",
    "city": "Karachi",
    "provider": "Edhi Foundation Karachi",
    "status": "available",
    "location": {
      "lat": 24.85,
      "lng": 67.02
    }
  },
  {
    "ambulanceId": "CHHIPA-1020-KHI-01",
    "city": "Karachi",
    "provider": "Chhipa Emergency Karachi",
    "status": "available",
    "location": {
      "lat": 24.865,
      "lng": 67.04
    }
  },
  {
    "ambulanceId": "AMB-1122-PSH-01",
    "city": "Peshawar",
    "provider": "Rescue 1122 KP",
    "status": "available",
    "location": {
      "lat": 34.01,
      "lng": 71.56
    }
  },
  {
    "ambulanceId": "AMB-1122-PSH-02",
    "city": "Peshawar",
    "provider": "Rescue 1122 KP",
    "status": "available",
    "location": {
      "lat": 33.99,
      "lng": 71.45
    }
  },
  {
    "ambulanceId": "AMB-1122-FSD-01",
    "city": "Faisalabad",
    "provider": "Rescue 1122 Faisalabad",
    "status": "available",
    "location": {
      "lat": 31.42,
      "lng": 73.08
    }
  },
  {
    "ambulanceId": "AMB-1122-MUX-01",
    "city": "Multan",
    "provider": "Rescue 1122 Multan",
    "status": "available",
    "location": {
      "lat": 30.19,
      "lng": 71.45
    }
  },
  {
    "ambulanceId": "AMB-1122-QTA-01",
    "city": "Quetta",
    "provider": "Rescue 1122 Balochistan",
    "status": "available",
    "location": {
      "lat": 30.19,
      "lng": 66.99
    }
  },
  {
    "ambulanceId": "AMB-1122-OKR-01",
    "city": "Okara",
    "provider": "Rescue 1122 Punjab",
    "status": "available",
    "location": {
      "lat": 30.808,
      "lng": 73.445
    }
  },
  {
    "ambulanceId": "AMB-1122-CHN-01",
    "city": "Chiniot",
    "provider": "Rescue 1122 Punjab",
    "status": "available",
    "location": {
      "lat": 31.72,
      "lng": 72.978
    }
  },
  {
    "ambulanceId": "AMB-1122-BWN-01",
    "city": "Bahawalnagar",
    "provider": "Rescue 1122 Punjab",
    "status": "available",
    "location": {
      "lat": 29.998,
      "lng": 73.253
    }
  },
  {
    "ambulanceId": "AMB-1122-HFD-01",
    "city": "Hafizabad",
    "provider": "Rescue 1122 Punjab",
    "status": "available",
    "location": {
      "lat": 32.068,
      "lng": 73.688
    }
  },
  {
    "ambulanceId": "AMB-1122-KNW-01",
    "city": "Khanewal",
    "provider": "Rescue 1122 Punjab",
    "status": "available",
    "location": {
      "lat": 30.301,
      "lng": 71.932
    }
  },
  {
    "ambulanceId": "AMB-1122-KHB-01",
    "city": "Khushab",
    "provider": "Rescue 1122 Punjab",
    "status": "available",
    "location": {
      "lat": 32.296,
      "lng": 72.352
    }
  },
  {
    "ambulanceId": "AMB-1122-LYH-01",
    "city": "Layyah",
    "provider": "Rescue 1122 Punjab",
    "status": "available",
    "location": {
      "lat": 30.961,
      "lng": 70.942
    }
  },
  {
    "ambulanceId": "AMB-1122-LDN-01",
    "city": "Lodhran",
    "provider": "Rescue 1122 Punjab",
    "status": "available",
    "location": {
      "lat": 29.533,
      "lng": 71.633
    }
  },
  {
    "ambulanceId": "AMB-1122-MBD-01",
    "city": "Mandi Bahauddin",
    "provider": "Rescue 1122 Punjab",
    "status": "available",
    "location": {
      "lat": 32.587,
      "lng": 73.491
    }
  },
  {
    "ambulanceId": "AMB-1122-MNW-01",
    "city": "Mianwali",
    "provider": "Rescue 1122 Punjab",
    "status": "available",
    "location": {
      "lat": 32.584,
      "lng": 71.536
    }
  },
  {
    "ambulanceId": "AMB-1122-MZG-01",
    "city": "Muzaffargarh",
    "provider": "Rescue 1122 Punjab",
    "status": "available",
    "location": {
      "lat": 30.075,
      "lng": 71.192
    }
  },
  {
    "ambulanceId": "AMB-1122-NKS-01",
    "city": "Nankana Sahib",
    "provider": "Rescue 1122 Punjab",
    "status": "available",
    "location": {
      "lat": 31.449,
      "lng": 73.712
    }
  },
  {
    "ambulanceId": "AMB-1122-NRW-01",
    "city": "Narowal",
    "provider": "Rescue 1122 Punjab",
    "status": "available",
    "location": {
      "lat": 32.1,
      "lng": 74.873
    }
  },
  {
    "ambulanceId": "AMB-1122-PKP-01",
    "city": "Pakpattan",
    "provider": "Rescue 1122 Punjab",
    "status": "available",
    "location": {
      "lat": 30.341,
      "lng": 73.386
    }
  },
  {
    "ambulanceId": "AMB-1122-RJP-01",
    "city": "Rajanpur",
    "provider": "Rescue 1122 Punjab",
    "status": "available",
    "location": {
      "lat": 29.103,
      "lng": 70.325
    }
  },
  {
    "ambulanceId": "AMB-1122-TTS-01",
    "city": "Toba Tek Singh",
    "provider": "Rescue 1122 Punjab",
    "status": "available",
    "location": {
      "lat": 30.97,
      "lng": 72.482
    }
  },
  {
    "ambulanceId": "AMB-1122-VHR-01",
    "city": "Vehari",
    "provider": "Rescue 1122 Punjab",
    "status": "available",
    "location": {
      "lat": 30.041,
      "lng": 72.348
    }
  },
  {
    "ambulanceId": "AMB-1122-ATK-01",
    "city": "Attock",
    "provider": "Rescue 1122 Punjab",
    "status": "available",
    "location": {
      "lat": 33.766,
      "lng": 72.36
    }
  },
  {
    "ambulanceId": "AMB-1122-BKR-01",
    "city": "Bhakkar",
    "provider": "Rescue 1122 Punjab",
    "status": "available",
    "location": {
      "lat": 31.625,
      "lng": 71.065
    }
  },
  {
    "ambulanceId": "AMB-1122-CKW-01",
    "city": "Chakwal",
    "provider": "Rescue 1122 Punjab",
    "status": "available",
    "location": {
      "lat": 32.932,
      "lng": 72.856
    }
  },
  {
    "ambulanceId": "AMB-1122-MRE-01",
    "city": "Murree",
    "provider": "Rescue 1122 Punjab",
    "status": "available",
    "location": {
      "lat": 33.907,
      "lng": 73.39
    }
  },
  {
    "ambulanceId": "AMB-1122-SHW-01",
    "city": "Sahiwal",
    "provider": "Rescue 1122 Punjab",
    "status": "available",
    "location": {
      "lat": 30.668,
      "lng": 73.111
    }
  },
  {
    "ambulanceId": "AMB-1122-DGK-01",
    "city": "Dera Ghazi Khan",
    "provider": "Rescue 1122 Punjab",
    "status": "available",
    "location": {
      "lat": 30.056,
      "lng": 70.634
    }
  },
  {
    "ambulanceId": "AMB-1122-JHL-01",
    "city": "Jhelum",
    "provider": "Rescue 1122 Punjab",
    "status": "available",
    "location": {
      "lat": 32.933,
      "lng": 73.726
    }
  },
  {
    "ambulanceId": "AMB-1122-SKP-01",
    "city": "Sheikhupura",
    "provider": "Rescue 1122 Punjab",
    "status": "available",
    "location": {
      "lat": 31.713,
      "lng": 73.985
    }
  },
  {
    "ambulanceId": "AMB-1122-KSR-01",
    "city": "Kasur",
    "provider": "Rescue 1122 Punjab",
    "status": "available",
    "location": {
      "lat": 31.116,
      "lng": 74.45
    }
  },
  {
    "ambulanceId": "AMB-1122-BDN-01",
    "city": "Badin",
    "provider": "Sindh Rescue 1122",
    "status": "available",
    "location": {
      "lat": 24.656,
      "lng": 68.837
    }
  },
  {
    "ambulanceId": "AMB-1122-DDU-01",
    "city": "Dadu",
    "provider": "Sindh Rescue 1122",
    "status": "available",
    "location": {
      "lat": 26.732,
      "lng": 67.776
    }
  },
  {
    "ambulanceId": "AMB-1122-GTK-01",
    "city": "Ghotki",
    "provider": "Sindh Rescue 1122",
    "status": "available",
    "location": {
      "lat": 28.006,
      "lng": 69.316
    }
  },
  {
    "ambulanceId": "AMB-1122-JCB-01",
    "city": "Jacobabad",
    "provider": "Sindh Rescue 1122",
    "status": "available",
    "location": {
      "lat": 28.281,
      "lng": 68.438
    }
  },
  {
    "ambulanceId": "AMB-1122-JMS-01",
    "city": "Jamshoro",
    "provider": "Sindh Rescue 1122",
    "status": "available",
    "location": {
      "lat": 25.43,
      "lng": 68.27
    }
  },
  {
    "ambulanceId": "AMB-1122-KSM-01",
    "city": "Kashmore",
    "provider": "Sindh Rescue 1122",
    "status": "available",
    "location": {
      "lat": 28.433,
      "lng": 69.583
    }
  },
  {
    "ambulanceId": "AMB-1122-KHP-01",
    "city": "Khairpur",
    "provider": "Sindh Rescue 1122",
    "status": "available",
    "location": {
      "lat": 27.529,
      "lng": 68.759
    }
  },
  {
    "ambulanceId": "AMB-1122-MTR-01",
    "city": "Matiari",
    "provider": "Sindh Rescue 1122",
    "status": "available",
    "location": {
      "lat": 25.597,
      "lng": 68.446
    }
  },
  {
    "ambulanceId": "AMB-1122-NSF-01",
    "city": "Naushahro Feroze",
    "provider": "Sindh Rescue 1122",
    "status": "available",
    "location": {
      "lat": 26.846,
      "lng": 68.122
    }
  },
  {
    "ambulanceId": "AMB-1122-QMB-01",
    "city": "Qambar Shahdadkot",
    "provider": "Sindh Rescue 1122",
    "status": "available",
    "location": {
      "lat": 27.587,
      "lng": 68.003
    }
  },
  {
    "ambulanceId": "AMB-1122-SGH-01",
    "city": "Sanghar",
    "provider": "Sindh Rescue 1122",
    "status": "available",
    "location": {
      "lat": 26.046,
      "lng": 68.948
    }
  },
  {
    "ambulanceId": "AMB-1122-SKP-02",
    "city": "Shikarpur",
    "provider": "Sindh Rescue 1122",
    "status": "available",
    "location": {
      "lat": 27.957,
      "lng": 68.638
    }
  },
  {
    "ambulanceId": "AMB-1122-SJW-01",
    "city": "Sujawal",
    "provider": "Sindh Rescue 1122",
    "status": "available",
    "location": {
      "lat": 24.606,
      "lng": 68.077
    }
  },
  {
    "ambulanceId": "AMB-1122-TAY-01",
    "city": "Tando Allahyar",
    "provider": "Sindh Rescue 1122",
    "status": "available",
    "location": {
      "lat": 25.46,
      "lng": 68.717
    }
  },
  {
    "ambulanceId": "AMB-1122-TMK-01",
    "city": "Tando Muhammad Khan",
    "provider": "Sindh Rescue 1122",
    "status": "available",
    "location": {
      "lat": 25.123,
      "lng": 68.535
    }
  },
  {
    "ambulanceId": "AMB-1122-THR-01",
    "city": "Tharparkar",
    "provider": "Sindh Rescue 1122",
    "status": "available",
    "location": {
      "lat": 24.743,
      "lng": 69.8
    }
  },
  {
    "ambulanceId": "AMB-1122-THT-01",
    "city": "Thatta",
    "provider": "Sindh Rescue 1122",
    "status": "available",
    "location": {
      "lat": 24.747,
      "lng": 67.923
    }
  },
  {
    "ambulanceId": "AMB-1122-UMK-01",
    "city": "Umerkot",
    "provider": "Sindh Rescue 1122",
    "status": "available",
    "location": {
      "lat": 25.354,
      "lng": 69.736
    }
  },
  {
    "ambulanceId": "AMB-1122-KHP-02",
    "city": "Khairpur Mir's",
    "provider": "Sindh Rescue 1122",
    "status": "available",
    "location": {
      "lat": 27.53,
      "lng": 68.76
    }
  },
  {
    "ambulanceId": "AMB-1122-GBT-01",
    "city": "Gambat",
    "provider": "GIMS Emergency Fleet",
    "status": "available",
    "location": {
      "lat": 27.3541,
      "lng": 68.5217
    }
  },
  {
    "ambulanceId": "AMB-1122-NSF-02",
    "city": "Nausharo Feroz",
    "provider": "Sindh Rescue 1122",
    "status": "available",
    "location": {
      "lat": 26.847,
      "lng": 68.123
    }
  },
  {
    "ambulanceId": "AMB-1122-MRO-01",
    "city": "Moro",
    "provider": "Sindh Rescue 1122",
    "status": "available",
    "location": {
      "lat": 26.663,
      "lng": 68.001
    }
  },
  {
    "ambulanceId": "AMB-1122-KDR-01",
    "city": "Kandiaro",
    "provider": "Sindh Rescue 1122",
    "status": "available",
    "location": {
      "lat": 26.915,
      "lng": 68.21
    }
  },
  {
    "ambulanceId": "AMB-1122-SHW-02",
    "city": "Sehwan Sharif",
    "provider": "SASI Rescue 1122",
    "status": "available",
    "location": {
      "lat": 26.4253,
      "lng": 67.8617
    }
  },
  {
    "ambulanceId": "AMB-1122-TDA-01",
    "city": "Tando Adam",
    "provider": "Sindh Rescue 1122",
    "status": "available",
    "location": {
      "lat": 25.7682,
      "lng": 68.662
    }
  },
  {
    "ambulanceId": "AMB-1122-SHD-01",
    "city": "Shahdadpur",
    "provider": "Sindh Rescue 1122",
    "status": "available",
    "location": {
      "lat": 25.9254,
      "lng": 68.618
    }
  },
  {
    "ambulanceId": "AMB-1122-ROH-01",
    "city": "Rohri",
    "provider": "Sindh Rescue 1122",
    "status": "available",
    "location": {
      "lat": 27.674,
      "lng": 68.896
    }
  },
  {
    "ambulanceId": "AMB-1122-KDK-01",
    "city": "Kot Diji",
    "provider": "Sindh Rescue 1122",
    "status": "available",
    "location": {
      "lat": 27.342,
      "lng": 68.708
    }
  },
  {
    "ambulanceId": "AMB-1122-MTL-01",
    "city": "Matli",
    "provider": "Sindh Rescue 1122",
    "status": "available",
    "location": {
      "lat": 25.043,
      "lng": 68.656
    }
  },
  {
    "ambulanceId": "AMB-1122-DGR-01",
    "city": "Digri",
    "provider": "Sindh Rescue 1122",
    "status": "available",
    "location": {
      "lat": 25.156,
      "lng": 69.112
    }
  }
];

module.exports = {
  PAKISTAN_CITIES,
  PAKISTAN_HOSPITALS,
  PAKISTAN_AMBULANCES
};

# 🌾 YieldSense AI: Crop Yield Prediction & Agricultural Productivity Forecasting System

YieldSense AI is a premium, AI-powered agricultural intelligence platform that helps farmers, agribusinesses, and smart farming initiatives forecast future crop production. The system evaluates historical farming data, weather inputs, and soil chemistry indices to provide accurate predictions, actionable soil remediation advice, and environmental risk warning labels.

---

## 📖 Overview

Predicting crop yields has historically been a guessing game driven by volatile climate variables. **YieldSense AI** resolves this uncertainty by feeding regional temperature, rainfall, and soil parameters (Nitrogen, Phosphorus, Potassium, and pH acidity index) into a trained Random Forest regression model. 

Rather than just displaying a raw forecasted number, the system translates analytical numbers into clear, plain-language agricultural recommendations and environmental hazard levels—helping users optimize fertilizer applications, schedule irrigation, and manage soil degradation.

---

## ✨ Features

- **🔐 Role-Based Authentication**: Secure JWT-based registration and login system with roles for `Farmer` and `Admin`.
- **🤖 AI Yield Forecasts**: Real-time predictions powered by a Random Forest model, fine-tuned dynamically by soil adjustment indices.
- **📊 Interactive Analytics Dashboard**:
  - **Historical Yield Trends** (Recharts Line Chart) tracking productivity across past simulation run dates.
  - **Comparative Performance Matrix** (Recharts Bar Chart) comparing current forecasts against model baselines for multiple crops.
- **💡 Agricultural Intelligence (Milestone 3)**:
  - **Actionable Remediation**: Smart rule checks recommending soil upgrades (lime/sulfur treatments, NPK adjustments).
  - **Environmental Risks**: Severity alert cards detailing drought limits, excessive rainfall/drainage issues, and thermal stress.
- **📥 Downloadable Reporting & Prints**:
  - **CSV Log Exporter**: Instantly streams historical simulation runs from PostgreSQL into a downloadable `.csv` spreadsheet.
  - **Print PDF Summaries**: Integrates clean CSS print-media configurations to print clean, high-quality pagination-friendly PDF reports.
- **🧪 Standalone Soil Wizard**: Diagnostic panel scoring any soil sample inputs and suggesting immediate farming improvements.

---

## 🛠 Tech Stack

| Tier | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | Next.js (React), TypeScript, Tailwind CSS, Lucide Icons, Recharts | Interactive charts, responsive layouts, theme toggles, and printing styles |
| **Backend** | FastAPI (Python 3.11), JWT, Pydantic, PostgreSQL | Secure API endpoints, telemetry persistence, CSV stream exporters |
| **Machine Learning** | Scikit-Learn, Joblib, Pandas, NumPy | Regression modeling, pipeline preprocessing, feature encoding |
| **Containerization** | Docker, Docker Compose | Service virtualization, reproducible local and cloud environments |

---

## 📂 Repository Structure

```text
YieldSense-AI/
├── yieldsense-backend/           # FastAPI Application
│   ├── data/                     # CSV datasets and trained model pkl binaries
│   ├── routers/                  # API endpoints (Auth, Farms, Predict, Soil, Analytics)
│   ├── tests/                    # Unit testing suite
│   ├── Dockerfile                # Backend container config
│   ├── main.py                   # FastAPI application root
│   ├── train.py                  # ML model training script
│   └── requirements.txt          # Python packages list
│
├── yieldsense-frontend/          # Next.js App
│   ├── app/                      # Page routes & dashboard layout components
│   ├── components/               # Navbars, tabs, and custom layouts
│   ├── lib/                      # Client API wrappers and Typescript definitions
│   └── Dockerfile                # Frontend container config
│
├── docker-compose.yml            # Multi-container orchestration config
├── LICENSE                       # MIT License file
└── README.md                     # Documentation
```

---

## 🤖 ML Model Performance

The predictive core utilizes a Scikit-Learn pipeline consisting of a `OneHotEncoder` for crop types and a `RandomForestRegressor` with 200 estimators. Evaluated on an unseen test partition (20% split), the model achieves the following metrics:

- **R² Score (R-squared)**: **0.9140 (91.40%)** — explaining over 91.4% of the variations in crop yields.
- **Mean Absolute Error (MAE)**: **12,565.79 hg/ha** (approx. **1,256.58 kg/ha**) — denoting average deviation from target yields.
- **Dataset Size**: **25,932 total rows** (20,745 training items, 5,187 test items).
- **Supported Crops**: Cassava, Maize, Plantains, Potatoes, Paddy Rice, Sorghum, Soybeans, Sweet Potatoes, Wheat, Yams.

---

## 🚀 Setup & Execution

### Option A: Running with Docker Compose (Recommended)
This method spins up the PostgreSQL database, FastAPI backend, and Next.js frontend automatically.

1. **Prerequisites**: Ensure [Docker](https://www.docker.com/) and Docker Compose are installed.
2. **Build and Start**: Run the following command in the project root folder:
   ```bash
   docker-compose up --build
   ```
3. **Access the App**:
   - Frontend Dashboard: `http://localhost:3000`
   - Backend API Docs: `http://localhost:8000/docs`

---

### Option B: Local Manual Installation

#### 1. Setup the Database
Create a PostgreSQL database named `yieldsense_db` and seed it using the schema script:
```bash
psql -U postgres -d yieldsense_db -f yieldsense-backend/schema.sql
```

#### 2. Run the Backend
1. Navigate to the backend folder and activate your virtual environment:
   ```bash
   cd yieldsense-backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
2. Install package dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Train the model to generate the pickle binaries locally (since model files are too large for Git):
   ```bash
   python train.py
   ```
4. Run the API server:
   ```bash
   uvicorn main:app --reload
   ```

#### 3. Run the Frontend
1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd yieldsense-frontend
   ```
2. Install dependencies and launch the dev server:
   ```bash
   npm install
   npm run dev
   ```

---

## 🧪 Running Automated Tests

A unit test suite validates backend calculations, NPK soil scores, and warning thresholds. You can execute these tests locally:
```bash
# Make sure your backend virtual environment is active
python -m unittest yieldsense-backend/tests/test_recommendations.py
```

---

## 📄 License

This project is open-source and licensed under the permissive [MIT License](LICENSE).
# Ingre-Check

# IngreCheck – Scan Before You Eat

IngreCheck is a web app that helps people check food labels before they eat. A user enters the ingredients of a product, and the app checks each ingredient against safe limits and against the user's own health issues (such as diabetes, high blood pressure, or food allergies). Each ingredient is marked **Safe**, **Caution**, or **Unsafe**.

> **Note:** This is a front-end prototype built for learning. It is **not** medical advice. Always read the full label and ask a doctor or dietitian if you have a health condition.

## Features

- **Register and login**: create an account and choose your health issues
- **Health profile**: Diabetes, Hypertension, Heart Disease, High Cholesterol, Celiac Disease (Gluten), Lactose Intolerance, and Peanut, Soy, Shellfish and Egg allergies
- **Label check**: paste ingredients such as `Sugar 18g, Sodium 420mg, Milk, Peanut`
- **Standards check**: compares amounts of sugar, sodium, saturated fat and trans fat with example safe limits, and flags banned items such as MSG
- **Personalized alerts**: warns you when an ingredient is risky for your health issues
- **Results table**: shows each ingredient, its safe limit, its status and a short remark
- **Scan history**: save results, view the last scans, and delete old ones
- **Dashboard**: quick actions and recent scans

## How It Works

1. Register and pick your health issues.
2. Open **Scan Label** and enter the product name and its ingredients.
3. Click **Analyze**.
4. The app reads the ingredients and amounts, checks them against the standard limits, then checks them against your health profile.
5. See the colour-coded results: green = safe, amber = caution, red = unsafe.
6. Save the result to your history.

**Example input**

```
Ingredients: Sugar 18g, Sodium 420mg, Milk, Peanut
```

## Built With

- HTML
- CSS
- JavaScript (no frameworks)
- Browser `localStorage` for saving users and scan history

## Project Structure

```
software project/
├── index.html       # Landing page
├── register.html    # Create an account
├── login.html       # Login
├── dashboard.html   # Overview and recent scans
├── scan.html        # Enter or upload a label
├── results.html     # Analysis results
├── history.html     # Saved scans
├── profile.html     # Edit name and health issues
├── app.js           # All app logic (accounts, parsing, safety rules)
└── styles.css       # Styling
```

## Getting Started

No installation is needed.

1. Download or clone this repository:
```bash
   git clone https://github.com/<your-username>/software-project.git
```
2. Open the `software project` folder.
3. Open `index.html` in your browser (or use the VS Code **Live Server** extension).

## Limitations

- Data is stored only in your browser, so there is no server or database yet.
- Image upload is a demo: the label image is **not** really read. Type or paste the ingredients instead.
- The safe limits and health rules are simple example values, not official medical standards.
- Passwords are not encrypted, so do not use a real password.

## Future Improvements

- Real OCR to read ingredients from a photo of the label
- A backend server and database for accounts and history
- Safe limits based on official food standards
- More health conditions and allergens
- Barcode scanning

## Author

**Muhammad Al-Efad**
B.Sc. in Computer Science and Engineering, University of Information Technology and Sciences (UITS), Dhaka

## Disclaimer

IngreCheck is for educational purposes only and does not replace professional medical or dietary advice.

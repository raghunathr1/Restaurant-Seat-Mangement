from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import json, os

app = Flask(__name__, template_folder="templates", static_folder="static")
CORS(app)

DATA_FILE = "data.json"

# -----------------------
# LOAD DATA
# -----------------------
def load_data():
    if not os.path.exists(DATA_FILE):
        return {"users": [], "bookings": []}
    with open(DATA_FILE, "r") as f:
        return json.load(f)

# -----------------------
# SAVE DATA
# -----------------------
def save_data(data):
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=4)

# =================================================
# USER PAGES
# =================================================

@app.route("/")
def home():
    return render_template("user/index.html")

@app.route("/login")
def login():
    return render_template("user/login.html")

@app.route("/signup")
def signup():
    return render_template("user/signup.html")

@app.route("/booking")
def booking():
    return render_template("user/booking.html")

@app.route("/mybooking")
def mybooking():
    return render_template("user/mybooking.html")

@app.route("/confirm")
def confirm():
    return render_template("user/confirm.html")

# =================================================
# ADMIN PAGES
# =================================================

@app.route("/admin")
def admin():
    return render_template("admin/admin.html")

@app.route("/admin/dashboard")
def admin_dashboard():
    return render_template("admin/dashboard.html")

@app.route("/admin/bookings")
def admin_bookings():
    return render_template("admin/booking.html")

@app.route("/admin/reports")
def admin_reports():
    return render_template("admin/reports.html")

@app.route("/admin/settings")
def admin_settings():
    return render_template("admin/settings.html")

@app.route("/admin/tables")
def admin_tables():
    return render_template("admin/tables.html")

@app.route("/admin/slots")
def admin_slots():
    return render_template("admin/timeslot.html")

# =================================================
# API
# =================================================

# SIGNUP
@app.route("/api/signup", methods=["POST"])
def api_signup():
    data = load_data()
    req = request.json

    if not req.get("name") or not req.get("email") or not req.get("password"):
        return jsonify({"msg": "All fields required"}), 400

    for u in data["users"]:
        if u["email"] == req["email"]:
            return jsonify({"msg": "User exists"}), 400

    data["users"].append(req)
    save_data(data)

    return jsonify({"msg": "Signup successful"})

# LOGIN
@app.route("/api/login", methods=["POST"])
def api_login():
    data = load_data()
    req = request.json

    for u in data["users"]:
        if u["email"] == req["email"] and u["password"] == req["password"]:
            return jsonify({"msg": "Login success", "user": u})

    return jsonify({"msg": "Invalid login"}), 401

# BOOK TABLE
@app.route("/api/book", methods=["POST"])
def api_book():
    data = load_data()
    req = request.json

    if not req.get("date") or not req.get("time") or not req.get("people"):
        return jsonify({"msg": "Missing fields"}), 400

    count = len([
        b for b in data["bookings"]
        if b["date"] == req["date"] and b["time"] == req["time"]
    ])

    if count >= 5:
        return jsonify({"msg": "No tables available"}), 400

    data["bookings"].append(req)
    save_data(data)

    return jsonify({"msg": "Booking confirmed"})

# USER BOOKINGS
@app.route("/api/mybookings/<name>")
def api_my_bookings(name):
    data = load_data()
    return jsonify([b for b in data["bookings"] if b["name"] == name])

# USER CANCEL
@app.route("/api/cancel", methods=["POST"])
def api_cancel():
    data = load_data()
    req = request.json

    data["bookings"] = [
        b for b in data["bookings"]
        if not (b["name"] == req["name"] and b["date"] == req["date"] and b["time"] == req["time"])
    ]

    save_data(data)
    return jsonify({"msg": "Booking cancelled"})

# ADMIN CANCEL
@app.route("/api/admin/cancel", methods=["POST"])
def admin_cancel():
    data = load_data()
    req = request.json

    data["bookings"] = [
        b for b in data["bookings"]
        if not (b["name"] == req["name"] and b["date"] == req["date"] and b["time"] == req["time"])
    ]

    save_data(data)
    return jsonify({"msg": "Booking cancelled by admin"})

# ADMIN ALL BOOKINGS
@app.route("/api/allbookings")
def api_all_bookings():
    data = load_data()
    return jsonify(data["bookings"])

# =================================================
# RUN
# =================================================
if __name__ == "__main__":
    app.run(debug=True)
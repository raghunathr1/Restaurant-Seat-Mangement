from flask import Flask, request, jsonify, render_template, redirect, session
from flask_cors import CORS
import json, os

app = Flask(__name__, template_folder="templates", static_folder="static")
app.secret_key = "secret123"
CORS(app)

DATA_FILE = "data.json"


# =======================
# LOAD / SAVE
# =======================
def load_data():
    if not os.path.exists(DATA_FILE):
        return {"users": [], "bookings": [], "tables": [], "slots": []}

    with open(DATA_FILE, "r") as f:
        data = json.load(f)

    data.setdefault("users", [])
    data.setdefault("bookings", [])
    data.setdefault("tables", [])
    data.setdefault("slots", [])

    return data


def save_data(data):
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=4)


# =======================
# DATE BLOCK CHECK (SAFE)
# =======================
def is_blocked(slots, date):
    for s in slots:
        if isinstance(s, dict) and s.get("start") and s.get("end"):
            if s["start"] <= date <= s["end"]:
                return True
    return False


# =======================
# PAGES
# =======================
@app.route("/")
def choose():
    return render_template("choose.html")


@app.route("/home")
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


# =======================
# ADMIN LOGIN
# =======================
@app.route("/admin")
def admin_page():
    return render_template("admin/login.html")


@app.route("/admin/login", methods=["POST"])
def admin_login():
    if request.form.get("username") == "admin" and request.form.get("password") == "123":
        session["admin"] = True
        return redirect("/admin/dashboard")

    return render_template("admin/login.html", error="Invalid Login")


def is_admin():
    return session.get("admin")


@app.route("/admin/dashboard")
def admin_dashboard():
    if not is_admin():
        return redirect("/admin")
    return render_template("admin/dashboard.html")


@app.route("/admin/bookings")
def admin_bookings():
    if not is_admin():
        return redirect("/admin")
    return render_template("admin/booking.html")


@app.route("/admin/tables")
def admin_tables():
    if not is_admin():
        return redirect("/admin")
    return render_template("admin/tables.html")


@app.route("/admin/slots")
def admin_slots():
    if not is_admin():
        return redirect("/admin")
    return render_template("admin/timeslot.html")


@app.route("/admin/logout")
def admin_logout():
    session.pop("admin", None)
    return redirect("/admin")


# =======================
# USER AUTH
# =======================
@app.route("/api/signup", methods=["POST"])
def api_signup():
    data = load_data()
    data["users"].append(request.json)
    save_data(data)
    return jsonify({"msg": "Signup successful"})


@app.route("/api/login", methods=["POST"])
def api_login():
    data = load_data()
    req = request.json

    for u in data["users"]:
        if u["email"] == req["email"] and u["password"] == req["password"]:
            return jsonify({"msg": "Login success", "user": u})

    return jsonify({"msg": "Invalid login"}), 401


# =======================
# TABLES (FIXED)
# =======================
@app.route("/api/tables")
def get_tables():
    return jsonify(load_data()["tables"])


@app.route("/api/tables/add", methods=["POST"])
def add_table():
    data = load_data()
    req = request.json

    # prevent duplicate ID
    for t in data["tables"]:
        if t["id"] == req["id"]:
            return jsonify({"msg": "Table already exists"}), 400

    data["tables"].append({
        "id": req["id"],
        "seats": int(req["seats"])
    })

    save_data(data)
    return jsonify({"msg": "Table added"})


# ✅ DELETE TABLE (NEW FIX)
@app.route("/api/tables/delete/<tid>", methods=["DELETE"])
def delete_table(tid):
    data = load_data()

    data["tables"] = [t for t in data["tables"] if t["id"] != tid]

    save_data(data)
    return jsonify({"msg": "Table removed"})


# =======================
# SLOTS
# =======================
@app.route("/api/slots")
def get_slots():
    return jsonify(load_data()["slots"])


@app.route("/api/slots/add", methods=["POST"])
def add_slot():
    data = load_data()
    req = request.json

    new_id = len(data["slots"]) + 1

    data["slots"].append({
        "id": new_id,
        "start": req["start"],
        "end": req["end"]
    })

    save_data(data)
    return jsonify({"msg": "Slot blocked"})


@app.route("/api/slots/delete/<int:id>", methods=["DELETE"])
def delete_slot(id):
    data = load_data()

    data["slots"] = [s for s in data["slots"] if s.get("id") != id]

    save_data(data)
    return jsonify({"msg": "Slot removed"})


# =======================
# AVAILABILITY
# =======================
@app.route("/api/checkavailability", methods=["POST"])
def check_availability():
    data = load_data()
    req = request.json

    date = req.get("date")
    time = req.get("time")
    people = int(req.get("people"))

    if is_blocked(data["slots"], date):
        return jsonify({"available": False, "message": "Date blocked", "tables": []})

    booked = [
        b["table_id"]
        for b in data["bookings"]
        if b["date"] == date and b["time"] == time
    ]

    available = [
        t for t in data["tables"]
        if t["id"] not in booked and t["seats"] >= people
    ]

    return jsonify({
        "available": len(available) > 0,
        "message": "Available" if available else "No tables",
        "tables": available
    })


# =======================
# BOOKING
# =======================
@app.route("/api/book", methods=["POST"])
def book():
    data = load_data()
    req = request.json

    if is_blocked(data["slots"], req["date"]):
        return jsonify({"msg": "Date blocked"}), 400

    booked = [
        b["table_id"]
        for b in data["bookings"]
        if b["date"] == req["date"] and b["time"] == req["time"]
    ]

    available = [
        t for t in data["tables"]
        if t["id"] not in booked and t["seats"] >= int(req["people"])
    ]

    if not available:
        return jsonify({"msg": "No table available"}), 400

    table = available[0]

    new_id = len(data["bookings"]) + 1

    data["bookings"].append({
        "id": new_id,
        "name": req["name"],
        "date": req["date"],
        "time": req["time"],
        "people": int(req["people"]),
        "table_id": table["id"]
    })

    save_data(data)

    return jsonify({
        "msg": "Booking confirmed",
        "table_id": table["id"]
    })


# =======================
# CANCEL BOOKING
# =======================
@app.route("/api/cancel/<int:bid>", methods=["DELETE"])
def cancel_booking(bid):
    data = load_data()

    data["bookings"] = [b for b in data["bookings"] if b.get("id") != bid]

    save_data(data)
    return jsonify({"msg": "Booking cancelled"})


# =======================
# BOOKINGS
# =======================
@app.route("/api/allbookings")
def all_bookings():
    return jsonify(load_data()["bookings"])


@app.route("/api/mybookings/<name>")
def my_bookings(name):
    return jsonify([b for b in load_data()["bookings"] if b["name"] == name])


# =======================
if __name__ == "__main__":
    app.run(debug=True)
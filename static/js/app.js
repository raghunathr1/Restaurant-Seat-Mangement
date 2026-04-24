const API = "http://127.0.0.1:5000/api";

// =======================
// COMMON FETCH
// =======================
async function apiRequest(url, method = "GET", body = null){
    let res = await fetch(url, {
        method,
        headers: {"Content-Type": "application/json"},
        body: body ? JSON.stringify(body) : null
    });
    return await res.json();
}

// =======================
// SIGNUP
// =======================
async function signup(){
    let name = document.getElementById("name").value;
    let email = document.getElementById("email").value;
    let pass = document.getElementById("pass").value;

    let data = await apiRequest(`${API}/signup`, "POST", {name, email, password: pass});
    alert(data.msg);
    if(data.msg === "Signup successful") window.location.href="/login";
}

// =======================
// LOGIN
// =======================
async function login(){
    let email = document.getElementById("loginEmail").value;
    let pass = document.getElementById("loginPass").value;

    let data = await apiRequest(`${API}/login`, "POST", {email, password: pass});

    if(data.user){
        localStorage.setItem("currentUser", JSON.stringify(data.user));
        alert("Login Success");
        window.location.href="/";
    } else {
        alert(data.msg);
    }
}

// =======================
// LOGOUT (USER + ADMIN)
// =======================
function logout(){
    localStorage.removeItem("currentUser");
    alert("Logged out successfully");
    window.location.href = "/login";
}

// =======================
// BOOK TABLE
// =======================
async function bookTable(){
    let user = JSON.parse(localStorage.getItem("currentUser"));

    if(!user){
        alert("Login first");
        window.location.href="/login";
        return;
    }

    let date = document.getElementById("date").value;
    let time = document.getElementById("time").value;
    let people = document.getElementById("people").value;

    let data = await apiRequest(`${API}/book`, "POST", {
        name: user.name,
        date,
        time,
        people
    });

    alert(data.msg);
    if(data.msg === "Booking confirmed") window.location.href="/confirm";
}

// =======================
// LOAD USER BOOKINGS
// =======================
async function loadMyBookings(){
    let user = JSON.parse(localStorage.getItem("currentUser"));

    if(!user){
        window.location.href="/login";
        return;
    }

    let data = await apiRequest(`${API}/mybookings/${user.name}`);
    let table = document.getElementById("myTable");

    let rows = `
    <tr>
    <th>Date</th>
    <th>Time</th>
    <th>People</th>
    <th>Action</th>
    </tr>`;

    if(data.length === 0){
        rows += `<tr><td colspan="4">No bookings</td></tr>`;
    }

    data.forEach(b => {
        rows += `
        <tr>
        <td>${b.date}</td>
        <td>${b.time}</td>
        <td>${b.people}</td>
        <td>
            <button onclick="cancelBooking('${b.date}','${b.time}')">Cancel</button>
        </td>
        </tr>`;
    });

    table.innerHTML = rows;
}

// =======================
// USER CANCEL
// =======================
async function cancelBooking(date, time){
    let user = JSON.parse(localStorage.getItem("currentUser"));

    let data = await apiRequest(`${API}/cancel`, "POST", {
        name: user.name,
        date,
        time
    });

    alert(data.msg);
    loadMyBookings();
}

// =======================
// ADMIN LOGIN
// =======================
function adminLogin(){
    let u = document.getElementById("adminUser").value;
    let p = document.getElementById("adminPass").value;

    if(u === "admin" && p === "123"){
        localStorage.setItem("admin", "true");
        window.location.href="/admin/dashboard";
    } else {
        alert("Invalid Admin");
    }
}

// =======================
// LOAD ALL BOOKINGS (ADMIN)
// =======================
async function loadAllBookings(){
    let data = await apiRequest(`${API}/allbookings`);
    let table = document.getElementById("bookingTable");

    let rows = `
    <tr>
    <th>Name</th>
    <th>Date</th>
    <th>Time</th>
    <th>People</th>
    <th>Action</th>
    </tr>`;

    if(data.length === 0){
        rows += `<tr><td colspan="5">No bookings</td></tr>`;
    }

    data.forEach(b => {
        rows += `
        <tr>
        <td>${b.name}</td>
        <td>${b.date}</td>
        <td>${b.time}</td>
        <td>${b.people}</td>
        <td>
            <button onclick="adminCancelBooking('${b.name}','${b.date}','${b.time}')">
            Cancel
            </button>
        </td>
        </tr>`;
    });

    table.innerHTML = rows;
}

// =======================
// ADMIN CANCEL
// =======================
async function adminCancelBooking(name, date, time){
    let confirmCancel = confirm("Cancel this booking?");
    if(!confirmCancel) return;

    let data = await apiRequest(`${API}/admin/cancel`, "POST", {
        name,
        date,
        time
    });

    alert(data.msg);
    loadAllBookings();
}
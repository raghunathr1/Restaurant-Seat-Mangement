const API = "http://127.0.0.1:5000/api";

let availabilityOK = false;

//
// =======================
// COMMON API FUNCTION
// =======================
async function apiRequest(url, method="GET", body=null){
    try{
        let res = await fetch(url,{
            method,
            headers:{"Content-Type":"application/json"},
            body: body ? JSON.stringify(body) : null
        });

        return await res.json();
    } catch(e){
        console.log(e);
        return {msg:"Server error"};
    }
}

//
// =======================
// NAVIGATION
// =======================
function go(path){
    window.location.href = path;
}

//
// =======================
// SIGNUP
// =======================
async function signup(){

    let data = await apiRequest(`${API}/signup`,"POST",{
        name:document.getElementById("name").value,
        email:document.getElementById("email").value,
        password:document.getElementById("pass").value
    });

    alert(data.msg);

    if(data.msg === "Signup successful"){
        window.location.href="/login";
    }
}

//
// =======================
// LOGIN USER
// =======================
async function login(){

    let data = await apiRequest(`${API}/login`,"POST",{
        email:document.getElementById("loginEmail").value,
        password:document.getElementById("loginPass").value
    });

    if(data.user){
        localStorage.setItem("currentUser", JSON.stringify(data.user));
        window.location.href="/home";
    } else {
        alert(data.msg);
    }
}

//
// =======================
// LOGOUT
// =======================
function logout(){
    localStorage.clear();
    window.location.href="/";
}

//
// =======================
// CHECK AVAILABILITY
// =======================
async function checkAvailability(){

    let data = await apiRequest(`${API}/checkavailability`,"POST",{
        date:document.getElementById("date").value,
        time:document.getElementById("time").value,
        people:document.getElementById("people").value
    });

    let msg = document.getElementById("msg");

    if(data.available){

        availabilityOK = true;

        let tableList = data.tables.map(t => t.id).join(", ");

        msg.innerText = `${data.message} | Tables: ${tableList}`;
        msg.style.color = "green";

    } else {

        availabilityOK = false;

        msg.innerText = data.message || "No tables available";
        msg.style.color = "red";
    }
}

//
// =======================
// BOOK TABLE
// =======================
async function bookTable(){

    if(!availabilityOK){
        alert("Check availability first");
        return;
    }

    let user = JSON.parse(localStorage.getItem("currentUser"));

    if(!user){
        alert("Login first");
        window.location.href="/login";
        return;
    }

    let data = await apiRequest(`${API}/book`,"POST",{
        name:user.name,
        date:document.getElementById("date").value,
        time:document.getElementById("time").value,
        people:document.getElementById("people").value
    });

    if(data.msg === "Booking confirmed"){
        localStorage.setItem("bookingInfo", JSON.stringify(data));
        window.location.href="/confirm";
    } else {
        alert(data.msg);
    }
}

//
// =======================
// CANCEL BOOKING
// =======================
async function cancelBooking(id){

    if(!confirm("Cancel this booking?")) return;

    let res = await fetch(`${API}/cancel/${id}`, {
        method: "DELETE"
    });

    let data = await res.json();

    alert(data.msg);

    loadMyBookings();
    loadAllBookings();
}

//
// =======================
// LOAD ALL BOOKINGS (ADMIN)
// =======================
async function loadAllBookings(){

    let data = await apiRequest(`${API}/allbookings`);

    let table = document.getElementById("bookingTable");
    if(!table) return;

    let rows = `
    <tr>
        <th>ID</th>
        <th>Name</th>
        <th>Date</th>
        <th>Time</th>
        <th>People</th>
        <th>Table</th>
        <th>Action</th>
    </tr>`;

    data.forEach(b => {
        rows += `
        <tr>
            <td>${b.id}</td>
            <td>${b.name}</td>
            <td>${b.date}</td>
            <td>${b.time}</td>
            <td>${b.people}</td>
            <td>${b.table_id}</td>
            <td>
                <button onclick="cancelBooking(${b.id})">Cancel</button>
            </td>
        </tr>`;
    });

    table.innerHTML = rows;
}

//
// =======================
// MY BOOKINGS (USER)
// =======================
async function loadMyBookings(){

    let user = JSON.parse(localStorage.getItem("currentUser"));
    if(!user) return;

    let data = await apiRequest(`${API}/mybookings/${user.name}`);

    let table = document.getElementById("myTable");
    if(!table) return;

    let rows = `
    <tr>
        <th>ID</th>
        <th>Date</th>
        <th>Time</th>
        <th>People</th>
        <th>Table</th>
        <th>Action</th>
    </tr>`;

    data.forEach(b => {
        rows += `
        <tr>
            <td>${b.id}</td>
            <td>${b.date}</td>
            <td>${b.time}</td>
            <td>${b.people}</td>
            <td>${b.table_id}</td>
            <td>
                <button onclick="cancelBooking(${b.id})">Cancel</button>
            </td>
        </tr>`;
    });

    table.innerHTML = rows;
}

//
// =======================
// TABLES (ADMIN)
// =======================
async function loadTables(){

    let data = await apiRequest(`${API}/tables`);

    let table = document.getElementById("tableList");
    if(!table) return;

    let rows = `
    <tr>
        <th>ID</th>
        <th>Seats</th>
        <th>Action</th>
    </tr>`;

    data.forEach(t => {
        rows += `
        <tr>
            <td>${t.id}</td>
            <td>${t.seats}</td>
            <td>
                <button onclick="deleteTable('${t.id}')">Delete</button>
            </td>
        </tr>`;
    });

    table.innerHTML = rows;
}

//
// =======================
// ADD TABLE
// =======================
async function addTable(){

    let data = await apiRequest(`${API}/tables/add`,"POST",{
        id:document.getElementById("tableId").value,
        seats:document.getElementById("seats").value
    });

    alert(data.msg);
    loadTables();
}

//
// =======================
// DELETE TABLE (NEW)
// =======================
async function deleteTable(id){

    if(!confirm("Delete this table?")) return;

    let res = await fetch(`${API}/tables/delete/${id}`, {
        method: "DELETE"
    });

    let data = await res.json();

    alert(data.msg);
    loadTables();
}

//
// =======================
// LOAD SLOTS
// =======================
async function loadSlots(){

    let data = await apiRequest(`${API}/slots`);

    let table = document.getElementById("slotList");
    if(!table) return;

    let rows = `
    <tr>
        <th>ID</th>
        <th>Start</th>
        <th>End</th>
        <th>Action</th>
    </tr>`;

    data.forEach(s => {
        rows += `
        <tr>
            <td>${s.id}</td>
            <td>${s.start}</td>
            <td>${s.end}</td>
            <td>
                <button onclick="cancelSlot(${s.id})">Remove</button>
            </td>
        </tr>`;
    });

    table.innerHTML = rows;
}

//
// =======================
// ADD SLOT
// =======================
async function addSlot(){

    let data = await apiRequest(`${API}/slots/add`,"POST",{
        start:document.getElementById("startDate").value,
        end:document.getElementById("endDate").value
    });

    alert(data.msg);
    loadSlots();
}

//
// =======================
// DELETE SLOT
// =======================
async function cancelSlot(id){

    if(!confirm("Remove this slot?")) return;

    let res = await fetch(`${API}/slots/delete/${id}`, {
        method: "DELETE"
    });

    let data = await res.json();

    alert(data.msg);
    loadSlots();
}
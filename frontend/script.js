const ul = document.querySelector(".left-list");
const getBtn = document.querySelector("#search-btn");
const getButton = document.querySelector("#get-students");
const input = document.querySelector("input");
const div = document.querySelector(".searchedStudent");
const PassKey = "YouAreVerified";

const logout = document.querySelector(".logout");
const mailbtn = document.querySelector("#mailbtn");

console.log('Script loaded');

function createNumber() {
  const one = first.value;
  const sec = second.value;
  const thi = third.value;
  const fou = fourth.value;

  const number = 1000 * one + 100 * sec + 10 * thi + 1 * fou;
  console.log(number);
}

getButton.onclick = async () => {
  const response = await axios.get(url);
  const students = response.data;
  ul.innerHTML = "";
  for (let student of students) {
    const ulhtml = `
        <li id = ${student._id}>
        <p> ${student.username} </p>
        <button class = "del"> Delete </button>
        <button class = "update"> Update </button>
        </li>
        `;
    ul.innerHTML += ulhtml;
  }
};

async function verifyOtp(otp) {
    console.log(otp);
    try {
        const response = await fetch("http://localhost:3000/verify-otp", {
            method:'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({otp})
        });

        console.log("Response status:", response.status); // Log response status

        if (response.ok) {
            const result = await response.json();

            if (result.success) {
                // OTP is valid, proceed with login or other actions
                console.log('OTP verification successful');
            } else {
                // OTP is invalid, display an error message
                console.error('Invalid OTP');
            }
        } else {
            // Handle non-successful response (e.g., 404, 500, etc.)
            console.error(`Error during OTP verification: ${response.status} - ${response.statusText}`);
        }
    }
    catch (err){
        console.log("Error:", err);
    }
}


getBtn.onclick = async () => {
  const username = input.value;
  if (!username) {
    alert("Enter User Name");
  }
  try {
    const response = await axios.get(`${url}/${username}`);
    const student = response.data;
    if (student.username === undefined) {
      div.innerHTML = `<p style = "color: red"> No Data Found <p>`;
    }
    div.innerHTML = `<p style = "color : green">Username: ${student.username} <i class="fa-solid fa-user-tie"></i>`;
  } catch (err) {
    console.log(err);
  }
};

document.addEventListener("click", async (e) => {
  const clickedDelButton = e.target.matches(".del");
  const clickedUpdateButton = e.target.matches(".update");

  if (clickedDelButton) {
    const li = e.target.parentElement;
    const idTodelete = li.id;

    // var keyInput = prompt("Enter Authentication Key", "");
    // if(keyInput === PassKey) {

    li.remove();

    try {
      await axios.delete(`${url}/${idTodelete}`);
      alert("Student Deleted");
    } catch (err) {
      console.log(err);
      alert("Couldn't Delete Student");
    }
    // }else{
    //     alert("User Unverified");
    // }
  }
  if (clickedUpdateButton) {
    var input = prompt("Enter updated username", "");
    const li = e.target.parentElement;
    const idToUpdate = li.id;
    if (!input) {
      alert("Enter valid username");
    } else {
      try {
        await axios.put(`${url}/${idToUpdate}/${input}`);
        alert("Username Updated");
        getButton.click();
      } catch (err) {
        console.log(err);
        alert("Could not update student");
      }
    }
  }
});

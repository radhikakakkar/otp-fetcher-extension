let client = {};
let client_json = {};

console.log("I'm script.js");
//on click function calls
document.addEventListener("DOMContentLoaded", function () {
  if (localStorage.getItem("client_creds") != null) {
    document.getElementById("connect-account-p").textContent =
      "Your account is connected";
    document.getElementById("connect-account-btn").textContent = "Proceed";
  }

  document
    .getElementById("connect-account-btn")
    .addEventListener("click", function () {
      connectAccount();
    });
  document
    .getElementById("get-results-btn")
    .addEventListener("click", function () {
      loadResults();
    });
  document.getElementById("logout-btn").addEventListener("click", function () {
    logout();
  });
});

async function connectAccount() {
  console.log("Connect account function called");

  if (localStorage.getItem("client_creds") != null) {
    // document.getElementById("connect-account-p").textContent =
    //   "Your account is connected";
    // document.getElementById("connect-account-btn").textContent = "Proceed";

    console.log("getting client from local");
    client = JSON.parse(localStorage.getItem("client_creds"));
    console.log(client);
  } else {
    console.log("generating new client and saving in local storage");

    //opening a new window for google auth STARTS

    // const newWindow = window.open(
    //   "http://localhost:3000/authorize",
    //   "_blank",
    //   "width=500,height=500"
    // );
    // newWindow.focus();
    // function receiveMessage(event) {
    //   if (event.origin === "http://localhost:3000") {
    //     console.log("Received data from child window:", event.data);
    //   }
    // }
    // newWindow.addEventListener("message", receiveMessage, false);
    // const result = receiveMessage();
    // newWindow.opener.postMessage(result, "http://localhost:3000");

    // Define the function to handle messages from the child window
    let dataToSend;
    function receiveMessage(event) {
      if (event.origin === "nognbilglhmklbccnilbollghnkfgbbj") {
        console.log("Received data from child window:", event.data);
      }
    }
    window.addEventListener("message", receiveMessage, false);
    const newWindow = window.open(
      "http://localhost:3000/redirect-to-auth",
      "",
      "width=100px,height=100px"
    );

    // newWindow.addEventListener("load", async function () {
    dataToSend = await fetch("http://localhost:3000/authorize");
    // console.log(dataToSend);
    // newWindow.postMessage(dataToSend, "nognbilglhmklbccnilbollghnkfgbbj");
    // });

    //opening a new window for google auth ENDS

    // client = await fetch("http://localhost:3000/authorize");
    client = dataToSend;
    console.log(dataToSend);
    client_json = await client.json();
    localStorage.setItem("client_creds", JSON.stringify(client_json));
  }

  if (client.credentials || client_json["credentials"]) {
    document.getElementById("connect-google-account-container").style.display =
      "none";
    document.getElementById("accounts-info-container").style.display = "block";
    document.getElementById("logout-btn").style.display = "block";
  } else {
    console.log("Error in client authorization");
  }
}

async function loadResults() {
  try {
    const container = document.getElementById("results-div");
    container.style.display = "block";

    const node_loader = document.createElement("div");
    node_loader.className = "loader";
    container.appendChild(node_loader);

    const response = await fetch("http://localhost:3000/get-otps");
    const data = await response.json();
    // sleep(1);
    container.innerHTML = "";
    for (var i = 0; i < data.length; i++) {
      console.log(data);
      //display sender_email
      const node_sender_email = document.createElement("p");
      node_sender_email.className = "sender_email";
      const sender_email_text = document.createTextNode(
        "Sender: " + " " + JSON.stringify(data[i]["sender_email"])
      );
      //display date
      const node_date = document.createElement("span");
      node_date.className = "date";
      const date_text = document.createTextNode(
        "Date: " + " " + JSON.stringify(data[i]["date"])
      );

      //display otp
      const node_otp = document.createElement("p");
      node_otp.className = "otp";
      const otp_text = document.createTextNode(JSON.stringify(data[i]["otp"]));

      //display break
      const node_br = document.createElement("br");
      const node_hr = document.createElement("hr");

      node_sender_email.appendChild(sender_email_text);
      node_date.appendChild(date_text);
      node_otp.appendChild(otp_text);
      container.appendChild(node_sender_email);
      container.appendChild(node_date);
      container.appendChild(node_br);
      container.appendChild(node_otp);
      container.appendChild(node_hr);
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

function logout() {
  localStorage.clear();
  if (localStorage.getItem("client_creds") == null) {
    document.getElementById("connect-account-p").textContent =
      "Connect Your Google Account to use the feature!";
    document.getElementById("connect-account-btn").textContent = "Connect";
  }
  console.log("You have been logged out");
  connect_account_container = document.getElementById(
    "connect-google-account-container"
  ).style.display = "block";
  document.getElementById("results-div").style.display = "none";
  document.getElementById("accounts-info-container").style.display = "none";
  document.getElementById("logout-btn").style.display = "none";
}

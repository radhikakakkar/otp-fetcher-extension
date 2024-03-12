//Frontend JS
let auth_token = "";

// tried using local storage, but it interanally saves the token in the "" else uses the profile present in chrome or uses the cached token present in chrome
chrome.storage.local.clear(() => {
  console.log("cleared");
});

document.getElementById("connect-account-btn").onclick = async function () {
  await chrome.storage.local.get(["user_auth_token"]).then((result) => {
    auth_token = result;
    console.log(auth_token);
  });

  if (auth_token.hasOwnProperty("user_auth_token")) {
    console.log("Token already generated and present");
    document.getElementById("connect-google-account-container").style.display =
      "none";
    document.getElementById("accounts-info-container").style.display = "block";
    // document.getElementById("logout-btn").style.display = "block";
  } else {
    console.log("Generating new token");

    try {
      const token = await chrome.identity.getAuthToken({ interactive: true });
      auth_token = token.token;
      await chrome.storage.local.set({ user_auth_token: token });
      console.log("User token:", auth_token);
    } catch (error) {
      console.error(error);
    }
    document.getElementById("connect-google-account-container").style.display =
      "none";
    document.getElementById("accounts-info-container").style.display = "block";
    // document.getElementById("logout-btn").style.display = "block";
  }
};

//Google API interaction prerequisites for JS client side app
const CLIENT_ID =
  "822867916804-mqu2m4m3sr9o8jujfcccao6ap3um6v10.apps.googleusercontent.com";
const API_KEY = "AIzaSyAyww5-KpjRLrTR-If8Q3izYRfMO24dvqw";
const DISCOVERY_DOC =
  "https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest";
const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];

// let gapiInited = false;
// let gisInited = false;

// function gapiLoaded() {
//   // console.log("gapi called");
//   gapi.load("client", initializeGapiClient);
// }
// async function initializeGapiClient() {
//   await gapi.client.init({
//     apiKey: API_KEY,
//     discoveryDocs: [DISCOVERY_DOC],
//   });

//   gapiInited = true;
//   maybeEnableButtons();
// }
// function maybeEnableButtons() {
//   if (gapiInited && gisInited) {
//     document.getElementById("get-results-btn").style.display = "block";
//     // console.log("button enabled");
//   }
// }
// async function gisLoaded() {
//   // console.log("gisloaded called");
//   // tokenClient = google.accounts.oauth2.initTokenClient({
//   //   client_id: CLIENT_ID,
//   //   scope: SCOPES,
//   //   // callback: "", // defined later
//   // });
//   await chrome.storage.local.get(["user_auth_token"]).then((result) => {
//     auth_token = result;
//     console.log(auth_token["user_auth_token"]);
//   });

//   tokenClient = {
//     client_id: CLIENT_ID,
//     scope: SCOPES,
//     // callback: "", // defined later
//     token: auth_token["user_auth_token"],
//   };
//   // console.log(tokenClient.token);
//   // console.log(tokenClient.scope);
//   gisInited = true;
//   maybeEnableButtons();
// }

async function injectCode(src, callback_func) {
  const script = document.createElement("script");
  // This is why it works!
  script.src = src;
  script.onload = async function () {
    console.log("script injected");
    await callback_func();
    this.remove();
  };

  // This script runs before the <head> element is created,
  // so we add the script to <html> instead.
  (document.head || document.documentElement).appendChild(script);
}

injectCode(
  // chrome.runtime.getURL("https://apis.google.com/js/api.js"),
  chrome.runtime.getURL("google/api.js")
  // gapiLoaded
);
injectCode(
  // chrome.runtime.getURL("https://accounts.google.com/gsi/client"),
  chrome.runtime.getURL("google/client.js")
  // gisLoaded
);

document.getElementById("get-results-btn").onclick = async function () {
  try {
    console.log(JSON.stringify(auth_token));
    const auth = JSON.stringify(auth_token);

    const container = document.getElementById("results-div");
    container.style.display = "block";

    const node_loader = document.createElement("div");
    node_loader.className = "loader";
    container.appendChild(node_loader);

    const response = await getEmails(auth);
    console.log(response);

    if (response.length === 0) {
      container.innerHTML = "";
      const no_results_text = document.createElement("p");
      const no_results_p_content = document.createTextNode(
        "There are no latest OTP emails"
      );
      no_results_text.appendChild(no_results_p_content);
      container.appendChild(no_results_text);
    } else {
      container.innerHTML = "";
      for (var i = 0; i < response.length; i++) {
        console.log(response);
        //display sender_email
        const node_sender_email = document.createElement("p");
        node_sender_email.className = "sender_email";
        const sender_email_text = document.createTextNode(
          "Sender: " + " " + JSON.stringify(response[i]["sender_email"])
        );
        //display date
        const node_date = document.createElement("span");
        node_date.className = "date";
        const date_text = document.createTextNode(
          "Date: " + " " + JSON.stringify(response[i]["date"])
        );

        //display otp
        const node_otp = document.createElement("p");
        node_otp.className = "otp";
        const otp_text = document.createTextNode(
          JSON.stringify(response[i]["otp"])
        );

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
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

// interaction with the Gmail API

function extractOtp(email_body) {
  console.log("i'm extract oTP");
  const otpRegex =
    // To authenticate your account, please enter the following code:\nHere's your Code/;
    /\b\d{6}\b/;
  const match = email_body.match(otpRegex);
  return match ? match[0] : null;
}
function extractTime(email_received_value) {
  const timeRegex = /\b\d{1,2}\s\w{3}\s\d{4}\b/;

  const match = email_received_value.match(timeRegex);

  return match ? match[0] : null;
}

// function to decode the body of the email
// function processParts(parts) {
//   let bodyMessage, bodyHtml;
//   for (const part of parts) {
//     const body = part.body;
//     const data = body.data;
//     const mimeType = part.mimeType;
//     if (mimeType === "multipart/alternative") {
//       const subparts = part.parts;
//       [bodyMessage, bodyHtml] = processParts(subparts);
//     } else if (mimeType === "text/plain") {
//       console.log("text/plain");
//       bodyMessage = Buffer.from(data, "base64").toString("utf-8");
//     } else if (mimeType === "text/html") {
//       console.log("text/html");
//       bodyHtml = Buffer.from(data, "base64").toString("utf-8");
//     }
//   }
//   return [bodyMessage, bodyHtml];
// }
// function processParts(parts) {
//   let bodyMessage = [];
//   let bodyHtml = [];

//   for (const part of parts) {
//     const body = part.body;
//     const data = body.data;
//     const mimeType = part.mimeType;

//     if (mimeType === "multipart/alternative") {
//       const subparts = part.parts;
//       const [subBodyMessage, subBodyHtml] = processParts(subparts);
//       bodyMessage = bodyMessage.concat(subBodyMessage);
//       bodyHtml = bodyHtml.concat(subBodyHtml);
//     } else if (mimeType === "text/plain") {
//       console.log("text/plain");
//       bodyMessage.push(Buffer.from(data, "base64").toString("utf-8"));
//     } else if (mimeType === "text/html") {
//       console.log("text/html");
//       bodyHtml.push(Buffer.from(data, "base64").toString("utf-8"));
//     }
//   }

//   return [bodyMessage, bodyHtml];
// }

var user_inbox_message_id = [];
var user_inbox_messages = [];

async function getEmails_new(auth) {
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${auth}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log(data);

    return data;
  } catch (error) {
    console.error("Error fetching email message:", error);
    throw error;
  }
}

async function getEmails(auth) {
  const data = []; //array of objects

  const otp_mail_subjects = [];
  const msg_id_url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20`;

  const user_inbox_message_ids = await fetch(msg_id_url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${auth}`,
      "Content-Type": "application/json",
    },
  });
  const ids = await user_inbox_message_ids.json();
  // console.log(ids);

  for (var i = 0; i < ids.messages.length; i++) {
    const final_mail_data = {
      sender_email: "",
      otp: "",
      date: "",
    }; //contains subject and OTP
    var current_id = ids.messages[i]["id"];
    // console.log(current_id);
    const msg_url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${current_id}`;
    // const msg_url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/18e24953bb3fa20d`;
    const current_message = await fetch(msg_url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${auth}`,
        "Content-Type": "application/json",
      },
    });
    const message = await current_message.json();
    // console.log(message.snippet);
    console.log(message.payload.headers);
    current_message_subject = message.payload.headers.forEach(function (e) {
      if (
        (e.name == "Subject" &&
          e.value.toLowerCase().includes("here's your authentication code")) ||
        (e.name == "From" &&
          e.value.toLowerCase().includes("here's your authentication code"))
      ) {
        const payload = message.payload;
        const parts = payload.parts;

        //to send the message body to extarct OTP
        // const [bodyMessage, bodyHtml] = processParts(parts);
        // const finalResult = bodyMessage.toString("utf-8");

        // final_mail_data["subject"] = e.value;
        //to send the message snippet to extarct OTP use - final_mail_data["otp"] = extractOtp(message.snippet);
        final_mail_data["otp"] = extractOtp(message.snippet);

        payload.headers.forEach((e) => {
          e.name == "Date"
            ? (final_mail_data["date"] = extractTime(e.value))
            : null;
          //
        });

        payload.headers.forEach((e) => {
          e.name == "Reply-To" || e.name == "From"
            ? (final_mail_data["sender_email"] = e.value)
            : null;
        });

        data.push(final_mail_data);
      }
    });
  }
  return data;
}

// function to list labels - basic function to verify interaction with gmail API
// async function listLabels() {
//   let response;
//   try {
//     response = await gapi.client.gmail.users.labels.list({
//       userId: "me",
//       auth: {
//         headers: {
//           Authorization: "Bearer " + tokenClient.token,
//         },
//       },
//     });
//   } catch (err) {
//     // document.getElementById("get-results-btn").innerText = err.message;
//     console.log(
//       "error in response = await gapi.client.gmail.users.labels.list " +
//         err.message
//     );
//     return;
//   }
//   const labels = response.result.labels;
//   if (!labels || labels.length == 0) {
//     document.getElementById("get-results-btn").innerText = "No labels found.";
//     return;
//   }
//   // Flatten to string to display
//   const output = labels.reduce(
//     (str, label) => `${str}${label.name}\n`,
//     "Labels:\n"
//   );
//   document.getElementById("get-results-btn").innerText = output;
// }

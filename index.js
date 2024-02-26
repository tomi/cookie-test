const http = require("http");
const fs = require("fs");
const url = require("url");
const querystring = require("querystring");

const sendResponse = (filename, statusCode, response, cookies = []) => {
  fs.readFile(filename, (error, data) => {
    if (error) {
      response.statusCode = 500;
      response.setHeader("Content-Type", "text/plain");
      response.end("Sorry, internal error occurred");
    } else {
      response.statusCode = statusCode;
      response.setHeader("Content-Type", "text/html");
      // Set cookies if any are provided
      if (cookies.length > 0) {
        response.setHeader("Set-Cookie", cookies);
      }
      response.end(data);
    }
  });
};

const server = http.createServer((request, response) => {
  const reqUrl = url.parse(request.url, true);
  const path = reqUrl.pathname;

  if (path === "/") {
    // Gather existing cookies to maintain them
    const cookies = request.headers.cookie ? request.headers.cookie.split("; ") : [];
    sendResponse("index.html", 200, response, cookies);
  } else if ((path === "/cookie/add" || path === "/cookie/remove") && request.method === "POST") {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk.toString();
    });
    request.on("end", () => {
      const parsedData = querystring.parse(body);
      const cookieData = parsedData.cookie.split("=");
      const cookieName = cookieData[0];
      const cookieValue = path === "/cookie/add" ? cookieData[1] : "";
      const cookie = `${cookieName}=${cookieValue}; Path=/; HttpOnly`;

      // If removing a cookie, set it to expire in the past
      if (path === "/cookie/remove") {
        const expiredCookie = `${cookieName}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly`;
        response.writeHead(302, { "Set-Cookie": expiredCookie, Location: "/" });
      } else {
        response.writeHead(302, { "Set-Cookie": cookie, Location: "/" });
      }
      response.end();
    });
  } else {
    sendResponse("404.html", 404, response);
  }
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

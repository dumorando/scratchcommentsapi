const express = require("express");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const app = express();

//check if a user exists with common scratch api errors.
async function userexists(username) {
    const response = await fetch(`https://api.scratch.mit.edu/users/${username}`).then(data => data.json());
    return !(response.code === "NotFound" || response.code === "ResourceNotFound")
}

app.get('/api/v1/userexists', async (req, res) => {
    if (!req.query.username) return res.status(400).json({"username":null, "exists":null, "error":"Missing username :("});
    res.json({
        "username": req.query.username,
        "exists": await userexists(req.query.username)
    });
});

app.get('/api/v1/comments', async (req, res) => {
    if (!req.query.username) return res.status(400).json({"comments":null, "error":"Missing username :("});
    if (!await userexists(req.query.username)) return res.status(400).json({"comments":null, "error":"User doesn't exist :("});
    const page = req.query.page ?? 1;
    //fetch the comment html
    const response = await fetch(`https://scratch.mit.edu/site-api/comments/user/${req.query.username}/?page=${page}`).then(data=>data.text());
    const { document } = (new JSDOM(response)).window;
    //get all divs (each div is a comment basically)
    const alldivs = Array.from(document.querySelectorAll("div.comment"));
    const comments = [];
    for (const div of alldivs) {
        const data = {};
        data.username = div.querySelector(".info > .name > a").innerHTML;
        data.content = div.querySelector(".info > .content").innerHTML.trim();
        comments.push(data);
    }
    res.json(comments)
});

app.listen(8080, () => console.log("Running on 8080 :)"))
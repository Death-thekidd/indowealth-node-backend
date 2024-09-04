require("dotenv").config();
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

const sanityClient = require("@sanity/client");

const client = sanityClient.createClient({
	projectId: "s9bsao5g",
	dataset: "production",
	apiVersion: "2024-08-23",
	useCdn: true,
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Serve PDF file with filestream
app.get("/download/:name", async (req, res) => {
	const name = req.params.name;

	try {
		// Fetch document with the file field
		const document = await client.fetch(
			`*[_type == "documentation" && name == $name][0]{name, "fileUrl": file.asset->url}`,
			{ name }
		);

		// Check if the document and the file URL exist
		if (!document || !document.fileUrl) {
			return res.status(404).send("File not found");
		}

		// Redirect to the file on Sanity's CDN
		res.redirect(document.fileUrl);
	} catch (error) {
		console.error("Error fetching document:", error);
		res.status(500).send("Error fetching document");
	}
});

// Contact form endpoint
app.post("/contact", (req, res) => {
	const { fname, lname, email, message } = req.body;

	const transporter = nodemailer.createTransport({
		host: process.env.SMTP_HOST,
		port: process.env.SMTP_PORT,
		secure: true, // true for 465, false for other ports
		auth: {
			user: process.env.SMTP_USER,
			pass: process.env.SMTP_PASS,
		},
	});

	const mailOptions = {
		from: email,
		to: "admin@indowealth.group", // replace with your receiving email
		subject: `Contact form submission from ${fname} ${lname}`,
		text: message,
	};

	transporter.sendMail(mailOptions, (error, info) => {
		if (error) {
			return res.status(500).send(error.toString());
		}
		res.status(200).send("Message sent successfully!");
	});
});

// Start server
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});

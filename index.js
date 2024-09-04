require("dotenv").config();
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Serve PDF file with filestream
app.get("/download/:filename", (req, res) => {
	const filename = req.params.filename;
	const filePath = path.join(__dirname, "assets", filename);

	if (fs.existsSync(filePath)) {
		const fileStream = fs.createReadStream(filePath);
		res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
		res.setHeader("Content-Type", "application/pdf");
		fileStream.pipe(res);
	} else {
		res.status(404).send("File not found");
	}
});

// Contact form endpoint
app.post("/contact", (req, res) => {
	const { name, email, message } = req.body;

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
		subject: `Contact form submission from ${name}`,
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

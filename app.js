const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const session = require('express-session');
const app = express();

const PORT = 1024;
const HOST = '0.0.0.0';

const publicDirectoryPath = path.join(__dirname, 'public');

app.use(express.static(publicDirectoryPath));
app.use(bodyParser.urlencoded({ extended: true }));

// Session setup
app.use(session({
  secret: 'yourSecretKey',
  resave: false,
  saveUninitialized: true,
}));

// Home route
app.get('/', (req, res) => {
  res.sendFile(path.join(publicDirectoryPath, 'home.html'));
});

// Signup routes
app.get('/signup', (req, res) => {
  res.sendFile(path.join(publicDirectoryPath, 'signup.html'));
});

app.post('/signup', (req, res) => {
  const { username, email, phone, password } = req.body;
  const userData = `${username},${email},${phone},${password}\n`;

  fs.appendFile(path.join(publicDirectoryPath, 'users.txt'), userData, (err) => {
    if (err) {
      return res.status(500).send('Server Error. Please try again.');
    }
    req.session.user = { username, email, phone };
    res.redirect('/profile');
  });
});

// Login routes
app.get('/login', (req, res) => {
  res.sendFile(path.join(publicDirectoryPath, 'login.html'));
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;

  fs.readFile(path.join(publicDirectoryPath, 'users.txt'), 'utf8', (err, data) => {
    if (err) {
      return res.status(500).send('Server Error. Please try again.');
    }

    const users = data.split('\n').map(line => line.split(','));
    const user = users.find(u => u[1] === email && u[3] === password);

    if (user) {
      req.session.user = { username: user[0], email: user[1], phone: user[2] };
      res.redirect('/profile');
    } else {
      res.status(401).send('Invalid email or password.');
    }
  });
});

// Profile route
app.get('/profile', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  res.sendFile(path.join(publicDirectoryPath, 'profile.html'));
});

// Update profile route
app.post('/update-profile', (req, res) => {
  if (!req.session.user) {
    return res.status(401).send('Unauthorized');
  }

  const { username, email, phone, password } = req.body;
  const newUserData = `${username},${email},${phone},${password}\n`;
  const oldEmail = req.session.user.email;

  fs.readFile(path.join(publicDirectoryPath, 'users.txt'), 'utf8', (err, data) => {
    if (err) {
      return res.status(500).send('Server Error. Please try again.');
    }

    const users = data.split('\n').filter(line => line.trim() !== '');
    const updatedUsers = users.map(line => {
      const [u, e, p, pw] = line.split(',');
      if (e === oldEmail) {
        return newUserData.trim();
      }
      return line;
    }).join('\n') + '\n';

    fs.writeFile(path.join(publicDirectoryPath, 'users.txt'), updatedUsers, (err) => {
      if (err) {
        return res.status(500).send('Server Error. Please try again.');
      }

      req.session.user = { username, email, phone };
      res.redirect('/profile');
    });
  });
});

app.get('/get-user', (req, res) => {
  if (!req.session.user) {
    return res.status(401).send('Unauthorized');
  }
  res.json(req.session.user);
});

app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}/`);
});


CREATE TABLE clubs (
id SERIAL PRIMARY KEY UNIQUE NOT NULL,
club_name VARCHAR(100),
is_public BOOLEAN,
date_created DATE
);

CREATE TABLE users (
id SERIAL PRIMARY KEY UNIQUE NOT NULL,
first_name VARCHAR(100),
last_name VARCHAR(100),
email VARCHAR(150),
user_name VARCHAR(100),
password VARCHAR(200),
date_joined DATE
);

CREATE TABLE profile_images (
user_id INTEGER REFERENCES users(id),
profile_image BLOB
); 

CREATE TABLE books (
id SERIAL PRIMARY KEY UNIQUE NOT NULL,
isbn VARCHAR(13),
title VARCHAR(100),
author VARCHAR(100),
cover_art TEXT,
summary TEXT
);

CREATE TABLE reviews (
id SERIAL PRIMARY KEY UNIQUE NOT NULL,
user_id INTEGER REFERENCES users(id),
book_id INTEGER REFERENCES books(id),
score INTEGER,
title VARCHAR(100),
body_text TEXT,
tstamp timestamp with TIME ZONE
);

CREATE TABLE comments (
id SERIAL PRIMARY KEY UNIQUE NOT NULL,
user_id INTEGER REFERENCES users(id),
reviews_id INTEGER REFERENCES reviews(id),
body_text TEXT,
tstamp timestamp WITH TIME ZONE
);

CREATE TABLE discussions ( 
id SERIAL PRIMARY KEY UNIQUE NOT NULL,
title VARCHAR(100),
club_id INTEGER REFERENCES clubs(id),
book_id INTEGER REFERENCES books(id),
creator INTEGER REFERENCES users(id),
tstamp timestamp WITH TIME ZONE
);

CREATE TABLE discussion_posts ( 
id SERIAL PRIMARY KEY UNIQUE NOT NULL,
title VARCHAR(100),
discussion_id INTEGER REFERENCES discussions(id),
user_id INTEGER REFERENCES users(id),
body_text TEXT,
tstamp timestamp WITH TIME ZONE
);

CREATE TABLE friends ( 
user1_id INTEGER REFERENCES users(id),
user2_id INTEGER REFERENCES users(id),
PRIMARY KEY (user1_id,user2_id)
);

CREATE TABLE club_enrollment ( 
user_id INTEGER REFERENCES users(id),
club_id INTEGER REFERENCES clubs(id),
PRIMARY KEY (user_id,club_id)
);

CREATE TABLE admins ( 
user_id INTEGER REFERENCES users(id),
club_id INTEGER REFERENCES clubs(id),
PRIMARY KEY (user_id,club_id)
);

CREATE TABLE club_books ( 
club_id INTEGER REFERENCES clubs(id),
book_id INTEGER REFERENCES books(id),
PRIMARY KEY (club_id,book_id)
);

CREATE TABLE user_books ( 
user_id INTEGER REFERENCES users(id),
book_id INTEGER REFERENCES books(id),
read_date DATE,
PRIMARY KEY (user_id,book_id)
);
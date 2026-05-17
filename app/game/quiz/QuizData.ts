// ─── Quiz Database ────────────────────────────────────────────────────────────
// Replace this with your real DB/API call in production.
// Shape: QuizDB[categoryId] = Question[]

export interface Question {
  id: number;
  question: string;
  options: [string, string, string, string];
  correct: 0 | 1 | 2 | 3; // index into options
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface Category {
  id: string;
  label: string;
  emoji: string;
  color: string; // accent tint
  description: string;
}

export const CATEGORIES: Category[] = [
  { id: "science",     label: "Science",       emoji: "🔬", color: "#10b981", description: "Physics, chemistry & biology" },
  { id: "history",     label: "History",       emoji: "🏛️", color: "#f59e0b", description: "Ancient to modern events"    },
  { id: "geography",   label: "Geography",     emoji: "🌍", color: "#3b82f6", description: "Countries, capitals & maps"  },
  { id: "technology",  label: "Technology",    emoji: "💻", color: "#8b5cf6", description: "Computers, AI & the web"     },
  { id: "sports",      label: "Sports",        emoji: "⚽", color: "#ef4444", description: "Records, teams & athletes"   },
  { id: "literature",  label: "Literature",    emoji: "📚", color: "#ec4899", description: "Books, authors & poetry"     },
  { id: "mathematics", label: "Mathematics",   emoji: "📐", color: "#06b6d4", description: "Numbers, logic & puzzles"    },
  { id: "movies",      label: "Movies & TV",   emoji: "🎬", color: "#f97316", description: "Cinema, shows & characters"  },
];

// ─── Science ─────────────────────────────────────────────────────────────────
const SCIENCE: Question[] = [
  { id: 1, question: "What is the chemical symbol for gold?", options: ["Ag","Au","Fe","Pb"], correct: 1, difficulty: "easy", explanation: "Gold's symbol 'Au' comes from the Latin word 'Aurum'." },
  { id: 2, question: "How many bones are in the adult human body?", options: ["206","208","198","212"], correct: 0, difficulty: "easy", explanation: "An adult human body has 206 bones. Babies are born with ~270, which fuse over time." },
  { id: 3, question: "What is the speed of light in vacuum (approx.)?", options: ["3×10⁸ m/s","3×10⁶ m/s","3×10⁵ m/s","3×10⁷ m/s"], correct: 0, difficulty: "medium", explanation: "The speed of light is approximately 299,792,458 m/s ≈ 3×10⁸ m/s." },
  { id: 4, question: "Which planet is known as the Red Planet?", options: ["Jupiter","Venus","Mars","Saturn"], correct: 2, difficulty: "easy", explanation: "Mars appears red because its surface is rich in iron oxide (rust)." },
  { id: 5, question: "What is the powerhouse of the cell?", options: ["Nucleus","Ribosome","Mitochondria","Golgi body"], correct: 2, difficulty: "easy", explanation: "Mitochondria produce ATP — the energy currency of the cell — through cellular respiration." },
  { id: 6, question: "What is the atomic number of carbon?", options: ["6","8","12","4"], correct: 0, difficulty: "medium", explanation: "Carbon has 6 protons, giving it the atomic number 6." },
  { id: 7, question: "Which gas makes up about 78% of Earth's atmosphere?", options: ["Oxygen","Carbon dioxide","Nitrogen","Argon"], correct: 2, difficulty: "medium", explanation: "Nitrogen (N₂) comprises about 78% of Earth's atmosphere, followed by oxygen at ~21%." },
  { id: 8, question: "DNA stands for:", options: ["Deoxyribonucleic Acid","Dextrose Nucleic Acid","Dinucleic Acid","Diribose Nucleic Acid"], correct: 0, difficulty: "easy", explanation: "DNA — Deoxyribonucleic Acid — carries the genetic instructions for all living organisms." },
  { id: 9, question: "Which law states that for every action there is an equal and opposite reaction?", options: ["Newton's 1st Law","Newton's 2nd Law","Newton's 3rd Law","Law of Gravitation"], correct: 2, difficulty: "medium", explanation: "Newton's Third Law of Motion: forces come in equal and opposite action-reaction pairs." },
  { id: 10, question: "What is the half-life of Carbon-14?", options: ["~5,730 years","~1,000 years","~10,000 years","~500 years"], correct: 0, difficulty: "hard", explanation: "Carbon-14 has a half-life of approximately 5,730 years, used in radiocarbon dating." },
  { id: 11, question: "The Hubble Space Telescope orbits Earth at approximately what altitude?", options: ["340 km","547 km","200 km","1,000 km"], correct: 1, difficulty: "hard", explanation: "HST orbits at ~547 km above Earth's surface." },
  { id: 12, question: "Which element has the highest melting point?", options: ["Iron","Tungsten","Platinum","Carbon"], correct: 1, difficulty: "hard", explanation: "Tungsten (W) melts at ~3,422°C — the highest of all known elements." },
];

// ─── History ──────────────────────────────────────────────────────────────────
const HISTORY: Question[] = [
  { id: 1, question: "In which year did World War II end?", options: ["1943","1944","1945","1946"], correct: 2, difficulty: "easy", explanation: "WWII ended in 1945 — V-E Day (May 8) in Europe and V-J Day (Sept 2) in the Pacific." },
  { id: 2, question: "Who was the first President of the United States?", options: ["Abraham Lincoln","George Washington","Thomas Jefferson","John Adams"], correct: 1, difficulty: "easy", explanation: "George Washington served as the 1st President from 1789 to 1797." },
  { id: 3, question: "The Great Wall of China was primarily built during which dynasty?", options: ["Tang","Song","Ming","Han"], correct: 2, difficulty: "medium", explanation: "Most of the existing Great Wall was built during the Ming dynasty (1368–1644)." },
  { id: 4, question: "Who was the Egyptian queen who allied with Julius Caesar and Mark Antony?", options: ["Nefertiti","Hatshepsut","Cleopatra","Isis"], correct: 2, difficulty: "easy", explanation: "Cleopatra VII formed alliances with both Julius Caesar and Mark Antony." },
  { id: 5, question: "The French Revolution began in which year?", options: ["1776","1789","1799","1804"], correct: 1, difficulty: "medium", explanation: "The French Revolution began in 1789 with the storming of the Bastille on July 14." },
  { id: 6, question: "Which empire was ruled by Genghis Khan?", options: ["Ottoman Empire","Mongol Empire","Roman Empire","Persian Empire"], correct: 1, difficulty: "easy", explanation: "Genghis Khan founded the Mongol Empire, the largest contiguous land empire in history." },
  { id: 7, question: "The Berlin Wall fell in which year?", options: ["1987","1988","1989","1991"], correct: 2, difficulty: "medium", explanation: "The Berlin Wall fell on November 9, 1989, symbolizing the end of the Cold War." },
  { id: 8, question: "Who wrote the Declaration of Independence?", options: ["Benjamin Franklin","John Adams","George Washington","Thomas Jefferson"], correct: 3, difficulty: "medium", explanation: "Thomas Jefferson was the principal author of the Declaration of Independence (1776)." },
  { id: 9, question: "The Battle of Waterloo took place in which year?", options: ["1812","1813","1814","1815"], correct: 3, difficulty: "hard", explanation: "Napoleon was defeated at Waterloo on June 18, 1815." },
  { id: 10, question: "Which ancient wonder was located in Alexandria, Egypt?", options: ["Colossus of Rhodes","Hanging Gardens","Great Lighthouse","Temple of Artemis"], correct: 2, difficulty: "hard", explanation: "The Lighthouse of Alexandria (Pharos) stood ~100m tall and guided ships for centuries." },
  { id: 11, question: "The Magna Carta was signed in which year?", options: ["1215","1248","1189","1307"], correct: 0, difficulty: "medium", explanation: "Magna Carta was signed by King John of England in 1215, limiting royal power." },
  { id: 12, question: "Who was the last Tsar of Russia?", options: ["Alexander II","Nicholas I","Alexander III","Nicholas II"], correct: 3, difficulty: "medium", explanation: "Nicholas II was the last Emperor of Russia, executed in 1918 during the Russian Revolution." },
];

// ─── Geography ────────────────────────────────────────────────────────────────
const GEOGRAPHY: Question[] = [
  { id: 1, question: "What is the capital of Australia?", options: ["Sydney","Melbourne","Canberra","Brisbane"], correct: 2, difficulty: "medium", explanation: "Canberra is Australia's capital — chosen as a compromise between Sydney and Melbourne." },
  { id: 2, question: "Which is the longest river in the world?", options: ["Amazon","Mississippi","Yangtze","Nile"], correct: 3, difficulty: "easy", explanation: "The Nile River, at ~6,650 km, is generally considered the world's longest river." },
  { id: 3, question: "Mount Everest lies on the border between Nepal and which country?", options: ["India","China","Bhutan","Tibet (China)"], correct: 3, difficulty: "medium", explanation: "Everest straddles the border between Nepal and the Tibet Autonomous Region of China." },
  { id: 4, question: "Which country has the most natural lakes?", options: ["Russia","USA","Brazil","Canada"], correct: 3, difficulty: "hard", explanation: "Canada has over 60% of the world's lakes — approximately 2 million." },
  { id: 5, question: "What is the smallest country in the world by area?", options: ["Monaco","San Marino","Vatican City","Liechtenstein"], correct: 2, difficulty: "easy", explanation: "Vatican City covers just 0.44 km² and is the smallest independent state in the world." },
  { id: 6, question: "The Amazon Rainforest is primarily located in which country?", options: ["Colombia","Peru","Venezuela","Brazil"], correct: 3, difficulty: "easy", explanation: "About 60% of the Amazon Rainforest lies within Brazil's borders." },
  { id: 7, question: "Which desert is the largest hot desert in the world?", options: ["Arabian","Gobi","Sahara","Kalahari"], correct: 2, difficulty: "easy", explanation: "The Sahara (~9.2 million km²) is the world's largest hot desert." },
  { id: 8, question: "What is the capital of Canada?", options: ["Toronto","Vancouver","Montreal","Ottawa"], correct: 3, difficulty: "medium", explanation: "Ottawa is Canada's capital city, located in Ontario." },
  { id: 9, question: "Which ocean is the largest?", options: ["Atlantic","Indian","Arctic","Pacific"], correct: 3, difficulty: "easy", explanation: "The Pacific Ocean covers more than 165 million km² — larger than all land combined." },
  { id: 10, question: "The Strait of Malacca connects the Indian Ocean to which sea?", options: ["South China Sea","Arabian Sea","Red Sea","Coral Sea"], correct: 0, difficulty: "hard", explanation: "The Strait of Malacca connects the Indian Ocean to the South China Sea." },
  { id: 11, question: "Which African country has the most pyramids?", options: ["Egypt","Libya","Ethiopia","Sudan"], correct: 3, difficulty: "hard", explanation: "Sudan (ancient Nubia/Kush) has more pyramids than Egypt — over 200 Nubian pyramids." },
  { id: 12, question: "Lake Baikal in Russia holds approximately what fraction of Earth's fresh surface water?", options: ["1/10","1/5","1/4","1/3"], correct: 1, difficulty: "hard", explanation: "Lake Baikal holds about 20% of the world's unfrozen fresh surface water." },
];

// ─── Technology ───────────────────────────────────────────────────────────────
const TECHNOLOGY: Question[] = [
  { id: 1, question: "What does 'HTTP' stand for?", options: ["HyperText Transfer Protocol","High Transfer Text Protocol","HyperText Transmission Protocol","Host Transfer Text Protocol"], correct: 0, difficulty: "easy", explanation: "HTTP — HyperText Transfer Protocol — is the foundation of data communication on the web." },
  { id: 2, question: "Who co-founded Apple Inc. with Steve Jobs and Ronald Wayne?", options: ["Bill Gates","Steve Wozniak","Jony Ive","Andy Rubin"], correct: 1, difficulty: "easy", explanation: "Steve Wozniak co-founded Apple with Steve Jobs and Ronald Wayne in 1976." },
  { id: 3, question: "What programming language was created by Guido van Rossum?", options: ["Ruby","Java","Python","Perl"], correct: 2, difficulty: "easy", explanation: "Guido van Rossum created Python and first released it in 1991." },
  { id: 4, question: "What does 'GPU' stand for?", options: ["General Processing Unit","Graphics Processing Unit","Global Processing Unit","Graphics Program Utility"], correct: 1, difficulty: "easy", explanation: "GPU — Graphics Processing Unit — originally designed for rendering graphics, now used for AI/ML." },
  { id: 5, question: "Which company developed the Android operating system?", options: ["Apple","Microsoft","Google","Samsung"], correct: 2, difficulty: "easy", explanation: "Android was developed by Google and released in 2008." },
  { id: 6, question: "What is the term for software that damages, disrupts, or gains unauthorized access to computer systems?", options: ["Firmware","Spyware","Malware","Adware"], correct: 2, difficulty: "medium", explanation: "Malware (malicious software) is an umbrella term covering viruses, ransomware, spyware, etc." },
  { id: 7, question: "In computing, what does 'RAM' stand for?", options: ["Read Access Memory","Random Access Memory","Rapid Access Module","Read Arithmetic Memory"], correct: 1, difficulty: "easy", explanation: "RAM — Random Access Memory — stores data temporarily for fast CPU access." },
  { id: 8, question: "What is the name of the first commercially successful web browser?", options: ["Internet Explorer","Firefox","Netscape Navigator","Mosaic"], correct: 2, difficulty: "hard", explanation: "Netscape Navigator launched in 1994 and dominated the early web era." },
  { id: 9, question: "What does 'SQL' stand for?", options: ["Structured Query Language","Simple Query Language","Sequential Query Logic","System Query Language"], correct: 0, difficulty: "medium", explanation: "SQL — Structured Query Language — is the standard language for relational databases." },
  { id: 10, question: "Which encryption standard replaced DES for securing electronic data?", options: ["RSA","SHA-256","AES","Blowfish"], correct: 2, difficulty: "hard", explanation: "AES (Advanced Encryption Standard) replaced DES in 2001 as the U.S. federal standard." },
  { id: 11, question: "What year was the World Wide Web invented by Tim Berners-Lee?", options: ["1983","1989","1993","1991"], correct: 1, difficulty: "medium", explanation: "Tim Berners-Lee invented the World Wide Web in 1989 while working at CERN." },
  { id: 12, question: "What is the time complexity of binary search?", options: ["O(n)","O(n²)","O(log n)","O(n log n)"], correct: 2, difficulty: "hard", explanation: "Binary search has O(log n) time complexity by halving the search space each iteration." },
];

// ─── Sports ───────────────────────────────────────────────────────────────────
const SPORTS: Question[] = [
  { id: 1, question: "How many players are on a standard football (soccer) team?", options: ["9","10","11","12"], correct: 2, difficulty: "easy", explanation: "A standard association football team has 11 players on the field." },
  { id: 2, question: "Which country has won the most FIFA World Cups?", options: ["Germany","Argentina","Italy","Brazil"], correct: 3, difficulty: "easy", explanation: "Brazil has won 5 FIFA World Cups: 1958, 1962, 1970, 1994, and 2002." },
  { id: 3, question: "In which sport do players use a shuttlecock?", options: ["Squash","Badminton","Table tennis","Lacrosse"], correct: 1, difficulty: "easy", explanation: "Badminton uses a shuttlecock (also called a birdie) instead of a ball." },
  { id: 4, question: "How many rings are on the Olympic flag?", options: ["4","5","6","7"], correct: 1, difficulty: "easy", explanation: "The Olympic flag has 5 rings, representing the 5 continents united by Olympism." },
  { id: 5, question: "Which athlete has won the most Olympic gold medals of all time?", options: ["Usain Bolt","Carl Lewis","Michael Phelps","Larisa Latynina"], correct: 2, difficulty: "medium", explanation: "Michael Phelps won 23 Olympic gold medals — the most by any athlete in history." },
  { id: 6, question: "What is the distance of a standard marathon?", options: ["40 km","42.195 km","40.5 km","42 km"], correct: 1, difficulty: "medium", explanation: "A marathon is exactly 42.195 km (26 miles 385 yards)." },
  { id: 7, question: "In tennis, what is the term for winning a game without the opponent scoring a point?", options: ["Shutout","Love game","Bagel","Ace"], correct: 1, difficulty: "hard", explanation: "A 'love game' in tennis means winning all four points while the opponent scores zero." },
  { id: 8, question: "Which country hosted the 2016 Summer Olympics?", options: ["China","UK","USA","Brazil"], correct: 3, difficulty: "medium", explanation: "The 2016 Summer Olympics were held in Rio de Janeiro, Brazil." },
  { id: 9, question: "In basketball, how many points is a standard free throw worth?", options: ["1","2","3","0.5"], correct: 0, difficulty: "easy", explanation: "A successful free throw in basketball is worth exactly 1 point." },
  { id: 10, question: "How many Grand Slam titles did Roger Federer win?", options: ["17","18","19","20"], correct: 3, difficulty: "medium", explanation: "Roger Federer won 20 Grand Slam singles titles during his career." },
  { id: 11, question: "What year did the first modern Olympic Games take place?", options: ["1894","1896","1900","1892"], correct: 1, difficulty: "medium", explanation: "The first modern Olympic Games were held in Athens, Greece in 1896." },
  { id: 12, question: "In cricket, how many balls are in a standard over?", options: ["4","5","6","8"], correct: 2, difficulty: "easy", explanation: "A standard over in cricket consists of 6 legal deliveries bowled consecutively." },
];

// ─── Literature ───────────────────────────────────────────────────────────────
const LITERATURE: Question[] = [
  { id: 1, question: "Who wrote 'Romeo and Juliet'?", options: ["Charles Dickens","Jane Austen","William Shakespeare","Oscar Wilde"], correct: 2, difficulty: "easy", explanation: "Romeo and Juliet was written by William Shakespeare around 1594–1596." },
  { id: 2, question: "In which novel does the character Atticus Finch appear?", options: ["Of Mice and Men","To Kill a Mockingbird","The Catcher in the Rye","1984"], correct: 1, difficulty: "easy", explanation: "Atticus Finch is the protagonist of Harper Lee's 'To Kill a Mockingbird' (1960)." },
  { id: 3, question: "Who wrote 'Pride and Prejudice'?", options: ["Charlotte Brontë","Emily Brontë","George Eliot","Jane Austen"], correct: 3, difficulty: "easy", explanation: "Jane Austen published 'Pride and Prejudice' in 1813." },
  { id: 4, question: "What is the name of the whale in 'Moby Dick'?", options: ["White Whale","Moby","The Great White","Dick"], correct: 0, difficulty: "medium", explanation: "Moby Dick is often referred to simply as 'the white whale' in Herman Melville's 1851 novel." },
  { id: 5, question: "'1984' was written by which author?", options: ["Aldous Huxley","Ray Bradbury","George Orwell","H.G. Wells"], correct: 2, difficulty: "easy", explanation: "George Orwell wrote 'Nineteen Eighty-Four' (1984), published in 1949." },
  { id: 6, question: "What is the first book of the Bible?", options: ["Exodus","Psalms","Genesis","Leviticus"], correct: 2, difficulty: "easy", explanation: "Genesis is the first book of both the Hebrew Bible and the Christian Old Testament." },
  { id: 7, question: "Who wrote 'The Odyssey'?", options: ["Virgil","Sophocles","Plato","Homer"], correct: 3, difficulty: "medium", explanation: "The Odyssey is an ancient Greek epic poem attributed to Homer." },
  { id: 8, question: "In Dante's 'Inferno', how many circles of Hell are there?", options: ["7","8","9","10"], correct: 2, difficulty: "hard", explanation: "Dante's Inferno describes 9 circles of Hell, each for a different category of sinners." },
  { id: 9, question: "Which Shakespeare play features the character Iago?", options: ["Hamlet","Macbeth","Othello","King Lear"], correct: 2, difficulty: "medium", explanation: "Iago is the antagonist of Shakespeare's 'Othello'." },
  { id: 10, question: "What dystopian novel features the Handmaid Offred?", options: ["The Road","Brave New World","Fahrenheit 451","The Handmaid's Tale"], correct: 3, difficulty: "medium", explanation: "Offred is the protagonist of Margaret Atwood's 'The Handmaid's Tale' (1985)." },
  { id: 11, question: "Who wrote 'Crime and Punishment'?", options: ["Leo Tolstoy","Ivan Turgenev","Anton Chekhov","Fyodor Dostoevsky"], correct: 3, difficulty: "medium", explanation: "Fyodor Dostoevsky wrote 'Crime and Punishment', published in 1866." },
  { id: 12, question: "What is the subtitle of Mary Shelley's 'Frankenstein'?", options: ["The New Prometheus","A Gothic Tale","The Modern Prometheus","Son of Science"], correct: 2, difficulty: "hard", explanation: "The full title is 'Frankenstein; or, The Modern Prometheus' (1818)." },
];

// ─── Mathematics ─────────────────────────────────────────────────────────────
const MATHEMATICS: Question[] = [
  { id: 1, question: "What is the value of π (pi) to two decimal places?", options: ["3.12","3.14","3.16","3.18"], correct: 1, difficulty: "easy", explanation: "Pi (π) ≈ 3.14159… commonly rounded to 3.14." },
  { id: 2, question: "What is the square root of 144?", options: ["11","12","13","14"], correct: 1, difficulty: "easy", explanation: "√144 = 12, since 12 × 12 = 144." },
  { id: 3, question: "What is the sum of angles in a triangle?", options: ["90°","180°","270°","360°"], correct: 1, difficulty: "easy", explanation: "The interior angles of any triangle sum to exactly 180°." },
  { id: 4, question: "What is 15% of 200?", options: ["25","30","35","40"], correct: 1, difficulty: "easy", explanation: "15% × 200 = 0.15 × 200 = 30." },
  { id: 5, question: "Which number is both a perfect square and a perfect cube?", options: ["16","27","64","100"], correct: 2, difficulty: "medium", explanation: "64 = 8² = 4³, making it both a perfect square and perfect cube." },
  { id: 6, question: "What is the Fibonacci number following 13?", options: ["18","20","21","24"], correct: 2, difficulty: "medium", explanation: "The Fibonacci sequence: …8, 13, 21, 34… Each number is the sum of the two before it." },
  { id: 7, question: "What is the derivative of sin(x)?", options: ["-cos(x)","cos(x)","-sin(x)","tan(x)"], correct: 1, difficulty: "hard", explanation: "d/dx [sin(x)] = cos(x)." },
  { id: 8, question: "A prime number greater than 2 is always:", options: ["Even","Divisible by 3","Odd","Divisible by 5"], correct: 2, difficulty: "medium", explanation: "All prime numbers greater than 2 are odd; if even, they'd be divisible by 2 and not prime." },
  { id: 9, question: "What is 2¹⁰ (2 to the power of 10)?", options: ["512","1024","2048","256"], correct: 1, difficulty: "medium", explanation: "2¹⁰ = 1,024. This is why 1 kilobyte is 1,024 bytes in computing." },
  { id: 10, question: "Euler's number (e) is approximately:", options: ["2.718","2.514","3.141","1.618"], correct: 0, difficulty: "medium", explanation: "Euler's number e ≈ 2.71828…, the base of the natural logarithm." },
  { id: 11, question: "In a right triangle, if the two legs are 3 and 4, what is the hypotenuse?", options: ["6","7","5","8"], correct: 2, difficulty: "easy", explanation: "By the Pythagorean theorem: √(3²+4²) = √(9+16) = √25 = 5." },
  { id: 12, question: "What is the probability of rolling a sum of 7 with two six-sided dice?", options: ["1/6","5/36","7/36","1/9"], correct: 0, difficulty: "hard", explanation: "There are 6 ways to roll a 7 out of 36 combinations: 6/36 = 1/6." },
];

// ─── Movies ───────────────────────────────────────────────────────────────────
const MOVIES: Question[] = [
  { id: 1, question: "Which film won the first Academy Award for Best Picture?", options: ["Gone with the Wind","Wings","The Jazz Singer","Sunrise"], correct: 1, difficulty: "hard", explanation: "'Wings' (1927) won the first Academy Award for Best Picture at the 1st Oscars in 1929." },
  { id: 2, question: "Who played Jack Dawson in 'Titanic' (1997)?", options: ["Brad Pitt","Matt Damon","Leonardo DiCaprio","Tom Hanks"], correct: 2, difficulty: "easy", explanation: "Leonardo DiCaprio played Jack Dawson opposite Kate Winslet's Rose in Titanic." },
  { id: 3, question: "What is the highest-grossing film of all time (unadjusted)?", options: ["Avengers: Endgame","Avatar","Titanic","Star Wars: The Force Awakens"], correct: 1, difficulty: "medium", explanation: "Avatar (2009, re-released 2022) holds the record at ~$2.92 billion worldwide." },
  { id: 4, question: "In 'The Godfather', who made someone 'an offer he can't refuse'?", options: ["Sonny Corleone","Tom Hagen","Michael Corleone","Vito Corleone"], correct: 3, difficulty: "medium", explanation: "Don Vito Corleone (played by Marlon Brando) is associated with this iconic line." },
  { id: 5, question: "Which director made 'Schindler's List'?", options: ["Martin Scorsese","Francis Ford Coppola","Steven Spielberg","Ridley Scott"], correct: 2, difficulty: "easy", explanation: "Steven Spielberg directed Schindler's List (1993), which won 7 Academy Awards." },
  { id: 6, question: "What is the name of the toy cowboy in 'Toy Story'?", options: ["Buzz","Rex","Woody","Hamm"], correct: 2, difficulty: "easy", explanation: "Woody is the cowboy doll voiced by Tom Hanks in Pixar's Toy Story franchise." },
  { id: 7, question: "In 'The Matrix', what color pill does Neo choose?", options: ["Blue","Green","Yellow","Red"], correct: 3, difficulty: "easy", explanation: "Neo chooses the red pill, which reveals the truth about the Matrix." },
  { id: 8, question: "Which actor played Iron Man / Tony Stark in the MCU?", options: ["Chris Evans","Chris Hemsworth","Robert Downey Jr.","Mark Ruffalo"], correct: 2, difficulty: "easy", explanation: "Robert Downey Jr. portrayed Tony Stark / Iron Man from 2008 to 2019 in the MCU." },
  { id: 9, question: "Who composed the iconic score for 'Star Wars'?", options: ["Hans Zimmer","John Williams","Ennio Morricone","Danny Elfman"], correct: 1, difficulty: "medium", explanation: "John Williams composed the Star Wars score, one of the most recognizable in cinema." },
  { id: 10, question: "Which Quentin Tarantino film features the character Jules Winnfield?", options: ["Reservoir Dogs","Kill Bill","Jackie Brown","Pulp Fiction"], correct: 3, difficulty: "medium", explanation: "Jules Winnfield, played by Samuel L. Jackson, appears in Pulp Fiction (1994)." },
  { id: 11, question: "What year was the original 'Jurassic Park' released?", options: ["1992","1993","1994","1991"], correct: 1, difficulty: "medium", explanation: "Jurassic Park directed by Spielberg was released on June 11, 1993." },
  { id: 12, question: "In 'Inception', what is Cobb's totem?", options: ["A coin","A chess piece","A spinning top","A die"], correct: 2, difficulty: "medium", explanation: "Cobb's totem is a spinning top that behaves differently in dreams vs reality." },
];

// ─── The Database ─────────────────────────────────────────────────────────────

export const QUIZ_DB: Record<string, Question[]> = {
  science:     SCIENCE,
  history:     HISTORY,
  geography:   GEOGRAPHY,
  technology:  TECHNOLOGY,
  sports:      SPORTS,
  literature:  LITERATURE,
  mathematics: MATHEMATICS,
  movies:      MOVIES,
};

/** Simulates an async DB fetch — returns 10 random questions for a category */
export async function fetchQuestions(categoryId: string): Promise<Question[]> {
  // Simulate network latency
  await new Promise((r) => setTimeout(r, 900 + Math.random() * 400));
  const all = QUIZ_DB[categoryId] ?? [];
  const shuffled = [...all].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 10);
}
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { LibraryList, Library, BookList, Book, Login, User, Register, BookReserved, BookStatus, RegisterSuccessful, ReservedHistory } from "./Pages";

import "./Compornent.css";
import "./TopPage.css";
import "./BookDetail.css";
import "./LibDetail.css";
import "./RegisterSuccess.css";
import "./ResCheck.css";
import "./ResSuccess.css";
import "./UserInfo.css";
import "./UserInfoChange.css";
import "./UserInfoChangeFin.css";
import "./UserLogin.css";

function App() {
	return (
		<BrowserRouter>
			<div id="wrapper">
				<header style={{ zIndex: 3000 }}>
					<div class="header-background">
						<p class="header-text">図書館びより</p>
					</div>
				</header>

				<Routes>
					<Route path="/" element={<BookList />} />
					<Route path="/book" element={<BookList />} />
					<Route path="/book/:bookId" element={<Book />} />
					<Route path="/book/:bookId/library" element={<LibraryList />} />
					<Route path="/book/:bookId/library/:libraryId" element={<BookStatus />} />
					<Route path="/book/:bookId/library/:libraryId/reserved" element={<BookReserved />} />

					<Route path="/library/:libraryId" element={<Library />} />

					<Route path="/login" element={<Login />} />
					<Route path="/user" element={<User />} />
					<Route path="/register" element={<Register />} />
					<Route path="/register_successful" element={<RegisterSuccessful />} />

					<Route path="/history" element={<ReservedHistory />} />
				</Routes>

				<footer>
					<div class="footer">
						<div class="footergoods"><Link to="/" class="textdecoration"><img src="/image/books.png" /></Link></div>
						<div class="footergoods"><Link to="/history" class="textdecoration"><img src="/image/bookmarks.png" /></Link></div>
						<div class="footergoods"><Link to="/user" class="textdecoration"><img src="/image/myPage.png" /></Link></div>
					</div>
				</footer>
			</div>
		</BrowserRouter>
	);
}

export default App;

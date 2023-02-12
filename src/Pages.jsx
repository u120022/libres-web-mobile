import { getDistance } from "geolib";
import Cookies from "js-cookie";
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams, } from "react-router-dom";
import { LibraryMaps } from "./Maps";

// 本の一覧
export function BookList() {
	const [page, setPage] = useState(0);
	const [filter, setFilter] = useState("プログラミング");
	const [backend, setBackend] = useState("rakuten");
	const [books, setBooks] = useState(undefined);

	const searchAsync = async () => {
		const query = new URLSearchParams({
			"filter": filter,
			"page_size": 20,
			"page": page,
			"backend": backend,
		});
		const res = await fetch("https://tpu-libres-api-v2.azurewebsites.net/book?" + query);
		const json = await res.json();
		setBooks(json.items);
	};

	useEffect(() => {
		searchAsync();
	}, [page]);

	if (books === undefined) {
		return (<div class="loader" />);
	}

	const booksView = books.map(book => {
		return (
			<Link to={"/book/" + book.isbn} class="textdecoration" >
				<div class="bookListBox" style={{ justifyContent: "space-between" }}>
					<div style={{ width: "30%", aspectRatio: "0.7" }}>
						<img src={book.image_url} style={{ width: "100%", height: "100%", backgroundColor: "gray" }} />
					</div>
					<div style={{ width: "65%" }}>
						<div class="bookListBookTitle">{book.title}</div>
						<div class="bookListBookAuther">{book.creators.join(" ")}</div>
						<div class="bookListBookAuther">{book.publishers.join(" ")}</div>
					</div>
				</div>
			</Link>
		);
	});

	return (
		<div>
			<form class="SearchBox" onSubmit={() => searchAsync()} method="dialog">
				<img src="/image/searchIcon.png" />
				<input
					type="text"
					value={filter}
					onChange={e => setFilter(e.target.value)}
					placeholder="本を検索"
					class="bookSearchBox"
				/>

				<select name="type" class="dropdown" value={backend} onChange={e => setBackend(e.target.value)}>
					<option value="rakuten">Rakuten</option>
					<option value="ndl">NDL</option>
					<option value="google">Google</option>
				</select>
			</form>

			<div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
				{booksView}
			</div>

			<button onClick={_ => setPage(prev => prev + 1)}>
				次のページ
			</button>

			<button onClick={_ => setPage(prev => prev - 1)}>
				前のページ
			</button>
		</div>
	);
}

// 本の詳細
export function Book() {
	const params = useParams();
	const bookId = params.bookId;

	const [backend, setBackend] = useState("ndl")
	const [record, setRecords] = useState(undefined);

	const findBookAsync = async () => {
		const res = await fetch("https://tpu-libres-api-v2.azurewebsites.net/book/" + bookId + "?backend=" + backend);
		const json = await res.json();
		setRecords(json);
	};

	useEffect(() => { findBookAsync(); }, [backend]);

	if (record === undefined) {
		return (<div class="loader" />);
	}

	const concatCreators = record.creators.join(", ");
	const concatPublishers = record.creators.join(", ");
	const concatDescriptions = record.descriptions.join(", ");
	const concatKeywords = record.keywords.join(", ");

	return (
		<div style={{ padding: "1rem" }}>
			<Link to="/">
				<img src="/image/backIcon.png" />
			</Link>

			<div>
				<select name="type" class="dropdown" value={backend} onChange={e => setBackend(e.target.value)}>
					<option value="rakuten">Rakuten</option>
					<option value="ndl">NDL</option>
					<option value="google">Google</option>
				</select>
			</div>

			<img class="bookImageDetail" src={record.image_url} />
			<div class="bookName">{record.title}</div>
			<div class="auther">{concatCreators}</div>
			<div class="publishedTitle">出版社</div>
			<div class="published">{concatPublishers}</div>
			<div class="publishedTitle">出版年</div>
			<div class="published">{record.issued_at}</div>
			<div class="publishedTitle">詳細</div>
			<div class="published">{concatDescriptions}</div>
			<div class="publishedTitle">キーワード</div>
			<div class="published">{concatKeywords}</div>

			<Link to={"/book/" + record.isbn + "/library"} class="textdecoration">
				<div class="button003">予約する図書館を選ぶ</div>
			</Link>
		</div>
	);
}

// 現在地を取得(非同期)
const getGeolocationAsync = () => new Promise((resolve, reject) => {
	navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true });
});

// 図書館の一覧
export function LibraryList() {
	const params = useParams();
	const bookId = params.bookId;

	const [geocode, setGeocode] = useState(undefined);
	const [libraryRecords, setRecords] = useState(undefined);
	const [extraLibraryItems, setExtraLibraryItems] = useState(undefined);

	const searchLibraryAsync = async () => {
		const geolocation = await getGeolocationAsync();
		const geocode = { lat: geolocation.coords.latitude, lng: geolocation.coords.longitude };
		setGeocode(geocode);

		const query = new URLSearchParams({
			latitude: geocode.lat,
			longitude: geocode.lng,
			limit: 10,
		});
		const res = await fetch("https://tpu-libres-api-v2.azurewebsites.net/library_geocode?" + query);
		const json = await res.json();
		setRecords(json.items);

		const query_0 = new URLSearchParams({
			isbn: bookId,
			library_names: json.items.map(item => item.name).join(","),
		});
		const res_0 = await fetch("https://tpu-libres-api-v2.azurewebsites.net/holder?" + query_0);
		const json_0 = await res_0.json();

		// join data schema library table into book status table
		json.items = json.items.map(library => {
			let x = json_0.items.find(bookStatus => library.name === bookStatus.library_name);
			return { ...library, state: x.state };
		});
		// 渡されたデータは近い順になっているので存在する近い順にソート
		json.items.sort((x, y) => (y.state != "Nothing") - (x.state != "Nothing"));
		setRecords(json.items);

		const query_1 = new URLSearchParams({
			isbn: bookId,
			page_size: 20,
			page: 0,
		});
		const res_1 = await fetch("https://tpu-libres-api-v2.azurewebsites.net/checked_holder?" + query_1);
		const json_1 = await res_1.json();
		setExtraLibraryItems(json_1.items);
	};

	useEffect(() => { searchLibraryAsync(); }, []);

	if (geocode === undefined || libraryRecords === undefined) {
		return (<div class="loader" />);
	}

	let recordsView = libraryRecords.map(record => {
		const [lat, lng] = record.geocode;
		const currentGeocode = { lat, lng };
		const distance = getDistance(currentGeocode, geocode);

		let reservable = (<div style={{ color: "gray" }}>問い合わせ中</div>);

		if (record.state) {
			if (record.state != "Nothing") {
				reservable = (<div style={{ fontWeight: "bold", color: "green" }}>予約できます</div>);
			} else {
				reservable = (<div style={{ color: "gray" }}>予約できません</div>);
			}
		}

		return (
			<Link to={"/book/" + bookId + "/library/" + record.name} class="textdecoration">
				<div style={{ padding: "1rem", borderWidth: "1px", borderColor: "#ccc", borderStyle: "solid", borderRadius: "1rem" }}>
					<div style={{ fontWeight: "bold" }}>{record.name}</div>
					<div style={{ color: "gray" }}>{record.prefecture} {record.city}</div>
					<div style={{ color: "gray" }}>距離 {distance / 1000}km</div>
					{reservable}
					<div style={{ color: "gray" }}>CALIL</div>
				</div>
			</Link>
		)
	});

	let extraView = undefined;
	if (extraLibraryItems) {
		extraView = extraLibraryItems.map(record =>
			<Link to={"/book/" + bookId + "/library/" + record.library_name} class="textdecoration">
				<div style={{ padding: "1rem", borderWidth: "1px", borderColor: "#ccc", borderStyle: "solid", borderRadius: "1rem" }}>
					<div style={{ fontWeight: "bold" }}>{record.library_name}</div>
					<div style={{ color: "gray" }}>在庫あり</div>
					<div style={{ color: "gray" }}>CINII</div>
				</div>
			</Link>
		);
	}

	return (
		<div style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "1rem" }}>
			<LibraryMaps geocode={geocode} libraryRecords={libraryRecords} />

			<div style={{ display: "flex", justifyContent: "space-between" }}>
				<input type="text" placeholder="図書館を検索" style={{ width: "60%", borderRadius: "1rem", padding: "0.5rem", borderWidth: "1px", borderColor: "#ccc" }} />
				<select name="type" style={{ width: "30%", borderRadius: "1rem", padding: "0.5rem", borderWidth: "1px", borderColor: "#ccc" }}>
					<option>指定しない</option>
				</select>
			</div>

			<div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
				{recordsView}
				{extraView}
			</div>
		</div>
	)
}

// 図書館の詳細
export function Library() {
	const params = useParams();
	const libraryId = params.libraryId;

	const [record, setRecord] = useState(undefined);

	const findLibraryAsync = async () => {
		const res = await fetch("https://tpu-libres-api-v2.azurewebsites.net/library/" + libraryId);
		const json = await res.json();
		setRecord(json);
	};

	useEffect(() => { findLibraryAsync(); }, []);

	if (record === undefined) {
		return (<div class="loader" />);
	}

	return (
		<div>
			<Link to="/">
				<img src="/image/backIcon.png" />
			</Link>

			<div class="textLogin4">{record.name}</div>

			<div class="libFrame">
				<div class="libFrameAddresTitle">住所</div>
				<div>{record.postcode}</div>
				<div>{record.address}</div>
				<div class="libFrameAddresTitle">電話番号</div>
				<div>{record.tel}</div>
			</div>
		</div>
	);
}

// 本の予約確認
export function BookStatus() {
	const navigate = useNavigate();
	const token = Cookies.get("TOKEN");

	const params = useParams();
	const bookId = params.bookId;
	const libraryId = params.libraryId;

	const [book, setBook] = useState(undefined);
	const [library, setLibrary] = useState(undefined);
	const [bookStatus, setBookStatus] = useState(undefined);
	const [statusMsg, setStatusMsg] = useState(undefined);

	const findBookAsync = async () => {
		const res = await fetch("https://tpu-libres-api-v2.azurewebsites.net/book/" + bookId + "?backend=ndl");
		const json = await res.json();
		setBook(json);
	}

	const findLibraryAsync = async () => {
		const res = await fetch("https://tpu-libres-api-v2.azurewebsites.net/library/" + libraryId);
		const json = await res.json();
		setLibrary(json);
	}

	const findBookStatusAsync = async () => {
		const res = await fetch("https://tpu-libres-api-v2.azurewebsites.net/holder?isbn=" + bookId + "&library_names=" + libraryId);
		const json = await res.json();
		setBookStatus(json);
	};

	const reserveAsync = async () => {
		if (token === undefined) {
			navigate("/login");
		}

		const res = await fetch(
			"https://tpu-libres-api-v2.azurewebsites.net/reserve_create",
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ token, isbn: book.isbn, library_name: library.name }),
			}
		);

		if (res.status === 200) {
			navigate("/book/" + bookId + "/library/" + libraryId + "/reserved")
		}

		setStatusMsg("手続きに失敗しました");
	};

	useEffect(() => {
		findBookAsync();
		findLibraryAsync();
		findBookStatusAsync();
	}, []);

	if (book === undefined || library === undefined || bookStatus === undefined) {
		return (<div class="loader" />);
	}

	if (bookStatus.items[0] != "Nothing") {
		return (
			<div>
				<Link to={"/book/" + bookId + "/library" + libraryId}>
					<img src="/image/backIcon.png" />
				</Link>

				<div class="resTitle">{library.name}<br />で予約しますか?</div>
				<div class="libDetailURL">
					<Link to={"/library/" + libraryId} class="textdecoration">この図書館の詳細ページを見る→</Link>
				</div>

				<img src={book.image_url} class="bookListBookImage2" />
				<div class="bookListBookTitle2">{book.title}</div>
				<div class="bookListBookAuther2">{book.creators[2]}</div>
				<div class="bookListBookAuther2">{book.creators[3]}</div>

				<button onClick={reserveAsync}>
					予約する
				</button>

				<div>{statusMsg}</div>
			</div>
		);
	} else {
		return (
			<div>
				<div class="resTitle">{library.name}<br />では予約できません</div>

				<div class="libDetailURL">
					<Link to={"/library/" + libraryId} class="textdecoration">この図書館の詳細ページを見る→</Link>
				</div>

				<img src={book.image_url} class="bookListBookImage2" />

				<div class="bookListBookTitle2">{book.title}</div>
				<div class="bookListBookAuther2">{book.creators[2]}</div>
				<div class="bookListBookAuther2">{book.creators[3]}</div>

				<Link to="/" class="textdecoration">
					<div class="button004">ホームに戻る</div>
				</Link>
			</div>
		);
	}
}

// 本の予約完了
export function BookReserved() {
	const params = useParams();
	const bookId = params.bookId;
	const libraryId = params.libraryId;

	const [book, setBook] = useState(undefined);
	const [library, setLibrary] = useState(undefined);

	const findBookAsync = async () => {
		const res = await fetch("https://tpu-libres-api-v2.azurewebsites.net/book/" + bookId + "?backend=ndl");
		const json = await res.json();
		setBook(json);
	};

	const findLibraryAsync = async () => {
		const res = await fetch("https://tpu-libres-api-v2.azurewebsites.net/library/" + libraryId);
		const json = await res.json();
		setLibrary(json);
	};

	useEffect(() => {
		findBookAsync();
		findLibraryAsync();
	}, [])

	if (book === undefined || library === undefined) {
		return (<div class="loader">Loading...</div>);
	}

	return (
		<div>
			<div class="resTitle2">「{book.title}」を</div>
			<div class="resTitle3">{library.name}<br />で予約しました</div>
			<Link to="/" class="textdecoration">
				<div class="button004">ホームに戻る</div>
			</Link>
		</div>
	);
}

// ログイン
export function Login() {
	const navigate = useNavigate();

	const loginAsync = async (e) => {
		const req = { email: e.target.email.value, password: e.target.password.value };
		const res = await fetch(
			"https://tpu-libres-api-v2.azurewebsites.net/user_login",
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(req),
			}
		);
		const json = await res.json();
		const token = json;

		Cookies.set("TOKEN", token);

		navigate("/user")
	};

	return (
		<div>
			<Link to="/">
				<img src="/image/backIcon.png" />
			</Link>

			<h1 class="textLogin">ログイン</h1>

			<div style={{ padding: "1rem" }}>
				<form style={{ display: "flex", flexDirection: "column", gap: "1rem" }} onSubmit={loginAsync} method="dialog">
					<div>メールアドレス<span style={{ color: "red" }}>(必須)</span></div>
					<input name="email" style={{ padding: "0.5rem", borderWidth: "1px", borderRadius: "0.5rem" }} type="email" required placeholder="xxx@example.com" />

					<div>パスワード<span style={{ color: "red" }}>(必須)</span></div>
					<input name="password" style={{ padding: "0.5rem", borderWidth: "1px", borderRadius: "0.5rem" }} type="password" required />

					<br />

					<input type="submit" value="ログイン" style={{ padding: "0.5rem", borderRadius: "1rem", backgroundColor: "white", borderWidth: "1px" }} />
				</form>
			</div>

			<Link to="/register" class="textdecoration">
				<div class="createAccount">アカウント作成→</div>
			</Link>
		</div>
	);
}

// ユーザ情報
export function User() {
	const navigate = useNavigate();
	const token = Cookies.get("TOKEN");
	const [user, setUser] = useState(undefined);

	const getUserAsync = async () => {
		const res = await fetch(
			"https://tpu-libres-api-v2.azurewebsites.net/user_get",
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ token }),
			}
		);
		setUser(await res.json());
	};

	const logoutAsync = async () => {
		await fetch(
			"https://tpu-libres-api-v2.azurewebsites.net/user_logout",
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ token }),
			}
		);

		Cookies.remove("TOKEN");

		navigate("/");
	};

	useEffect(() => {
		if (token === undefined) {
			navigate("/login");
		} else {
			getUserAsync();
		}
	}, []);

	if (token === undefined || user === undefined) {
		return (<div class="loader" />);
	}

	return (
		<div>
			<Link to="/">
				<img src="/image/backIcon.png" />
			</Link>

			<div style={{ padding: "1rem" }}>
				<p style={{ fontWeight: "bold" }}>氏名</p>
				<p>{user.fullname}</p>

				<p style={{ fontWeight: "bold" }}>住所</p>
				<p>{user.address}</p>

				<p style={{ fontWeight: "bold" }}>Eメール</p>
				<p>{user.email}</p>

				<p style={{ fontWeight: "bold" }}>パスワード</p>
				<p>********</p>

				<button onClick={logoutAsync}>ログアウト</button>
			</div>
		</div>
	);
}

// ユーザ作成
export function Register() {
	const navigate = useNavigate();
	const [statusMsg, setStatusMsg] = useState("");

	const registerAsync = async (e) => {
		setStatusMsg("作成中です");

		const req = {
			email: e.target.email.value,
			password: e.target.password.value,
			fullname: e.target.firstname.value + e.target.lastname.value,
			address: e.target.address.value,
		};
		const res = await fetch(
			"https://tpu-libres-api-v2.azurewebsites.net/user_create",
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(req),
			}
		);

		if (res.status === 200) {
			navigate("/register_successful");
		}

		setStatusMsg("作成に失敗しました");
	};

	return (
		<div>
			<Link to="/">
				<img src="/image/backIcon.png" />
			</Link>

			<h1 class="textLogin">アカウントを作成する</h1>

			<div style={{ padding: "2rem" }}>
				<form style={{ display: "flex", flexDirection: "column", gap: "1rem" }} onSubmit={registerAsync} method="dialog">
					<div>{statusMsg}</div>

					<div>氏名<span style={{ color: "red" }}>(必須)</span></div>
					<div style={{ display: "flex", gap: "1rem" }}>
						<input name="firstname" style={{ minWidth: "0", padding: "0.5rem", borderWidth: "1px", borderRadius: "0.5rem" }} type="text" required placeholder="図書" />
						<input name="lastname" style={{ minWidth: "0", padding: "0.5rem", borderWidth: "1px", borderRadius: "0.5rem" }} type="text" required placeholder="太郎" />
					</div>

					<div>住所<span style={{ color: "red" }}>(必須)</span></div>
					<input name="address" style={{ padding: "0.5rem", borderWidth: "1px", borderRadius: "0.5rem" }} type="text" required />

					<div>eメール<span style={{ color: "red" }}>(必須)</span></div>
					<input name="email" style={{ padding: "0.5rem", borderWidth: "1px", borderRadius: "0.5rem" }} type="email" required placeholder="xxx@example.com" />

					<div>パスワード<span style={{ color: "red" }}>(必須)</span></div>
					<input name="password" style={{ padding: "0.5rem", borderWidth: "1px", borderRadius: "0.5rem" }} type="password" required />

					<div />

					<input type="submit" class="button003" value="アカウントを作成する" style={{ border: "none" }} />
				</form>
			</div>
		</div>
	);
}

// ユーザ作成成功
export function RegisterSuccessful() {
	return (
		<div style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
			<div class="textlogin3" style={{ textAlign: "center" }}>アカウント作成が完了しました</div>

			<Link to="/login" class="textdecoration">
				<div class="button003">ログイン</div>
			</Link>
		</div>
	);
}

// 予約一覧
export function ReservedHistory() {
	const navigate = useNavigate();
	const token = Cookies.get("TOKEN");

	const [page, setPage] = useState(0);
	const [records, setRecords] = useState(undefined);

	const getHistoryAsync = async () => {
		const res = await fetch(
			"https://tpu-libres-api-v2.azurewebsites.net/reserve",
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ token, page, page_size: 20 }),
			}
		);
		const json = await res.json();
		const records = json.items;

		const joinQuery = records
			.map(record => (async () => {
				const res = await fetch("https://tpu-libres-api-v2.azurewebsites.net/book/" + record.isbn + "?backend=ndl");
				const json = await res.json();
				record.book = json;
				return record;
			})());

		const joined = await Promise.all(joinQuery);

		setRecords(joined);
	};

	useEffect(() => {
		if (token === undefined) {
			navigate("/login");
		} else {
			getHistoryAsync();
		}
	}, [page]);

	if (token === undefined || records === undefined) {
		return (<div class="loader" />);
	}

	const recordsView = records.map(record => {
		return (
			<Link to={"/book/" + record.book.isbn} class="textdecoration" >
				<div class="bookListBox" style={{ justifyContent: "space-between" }}>
					<div style={{ width: "30%", aspectRatio: "0.7" }}>
						<img src={record.book.image_url} style={{ width: "100%", height: "100%", backgroundColor: "gray" }} />
					</div>
					<div style={{ width: "65%" }}>
						<div class="bookListBookTitle">{record.book.title}</div>
						<div>{record.library_name}</div>
						<div class="bookListBookAuther">予約日 {record.staging_at}</div>
						<div class="bookListBookAuther">状態 {record.status}</div>
					</div>
				</div>
			</Link >
		);
	});

	return (
		<div>
			<div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
				{recordsView}
			</div>

			<button onClick={_ => setPage(prev => prev + 1)}>
				次のページ
			</button>

			<button onClick={_ => setPage(prev => prev - 1)}>
				前のページ
			</button>
		</div>
	)
}

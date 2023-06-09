import { useState, useEffect, useRef, useCallback } from "react";
import { Helmet } from "react-helmet";
import Banner from "../Banner";
import ErrorBoundary from "../ErrorBoundary";
import useMarvelService from "../../services/marvelService";
import filterWithImg from "../../utils/filterWithImg";
import setContent from "../../utils/setContent";
import CharList from "../CharList";

const MainPage = () => {
  const [charList, setCharList] = useState([]);
  const [hideSpinner, setHideSpinner] = useState(false);
  const [offset, setOffset] = useState(210);
  const [charEnded, setCharEnded] = useState(false);
  const [favourites, setFavourites] = useState([]);

  const { getAllCharacters, process, setProcess } = useMarvelService();

  const observer = useRef();
  const effectUsed = useRef(false);

  useEffect(() => {
    if (effectUsed.current === false) {
      const existingFavourites = JSON.parse(
        localStorage.getItem("marvelFavourites")
      );

      if (existingFavourites) {
        setFavourites(existingFavourites);
      }

      onRequest(offset, false);
      effectUsed.current = true;
    }
  }, []);

  const lastComicsRef = useCallback(
    (node) => {
      if (process === "loading") return;
      if (observer.current) {
        observer.current.disconnect();
      }
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !charEnded) {
          onRequest(offset);
        }
      });
      if (node) {
        observer.current.observe(node);
      }
    },
    [process, charEnded]
  );

  const onRequest = (offset, hideSpinner = true) => {
    setHideSpinner(hideSpinner);
    updateList(offset);
  };

  const onCharListLoaded = (newCharList) => {
    setCharEnded(newCharList.length < 9);
    const charsWithImg = filterWithImg(newCharList);
    setCharList((charList) => [...charList, ...charsWithImg]);
    setOffset((offset) => offset + 9);
  };

  const updateList = (offset) => {
    getAllCharacters(offset)
      .then(onCharListLoaded)
      .then(() => setProcess("loaded"));
  };

  const onFavouriteToggle = (id, isFavourite = false) => {
    const favouritesCopy = { ...favourites, [id]: id };
    if (isFavourite) {
      delete favouritesCopy[id];
    }
    setFavourites(favouritesCopy);
    localStorage.setItem("marvelFavourites", JSON.stringify(favouritesCopy));
  };

  const elements = () => {
    return setContent(
      process,
      () => (
        <CharList
          characters={charList}
          onFavouriteToggle={onFavouriteToggle}
          lastComicsRef={lastComicsRef}
          favourites={favourites}
        />
      ),
      hideSpinner
    );
  };

  return (
    <>
      <Helmet>
        <meta name="description" content="Marvel characters information" />
        <title>Marvel information portal</title>
      </Helmet>
      <Banner page="main" />
      <div className="char__content">
        <ErrorBoundary>{elements()}</ErrorBoundary>
      </div>
    </>
  );
};

export default MainPage;

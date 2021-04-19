import React, {useEffect, useState} from 'react';
import { useDispatch, useSelector, RootStateOrAny  } from 'react-redux';
import axios from 'axios';
import dotenv from 'dotenv';
import { RouteComponentProps, withRouter } from 'react-router';
import { RootState } from '../redux/modules/reducer';
import ItemCard from '../components/ItemCard/index';
import { Item, ItemHandler } from '../redux/modules/Items';
import {auctionSocket} from '../modules/socket';
import {bidData} from '../interface/Bid';
import { getFormatedItems } from '../modules/converters';

import LoadingModal from '../components/Modal/LoadingModal';
import Empty from '../components/Common/Empty';

import './style/SearchPage.scss';

let oneTime = false; // 무한스크롤시 중복요청 방지
let isChanged = false; // 페이지 이동시 이전 저장된 아이템이 안보이게
 
dotenv.config();

interface MatchParams {
  keyword: string;
}

const SearchPage:React.FC<RouteComponentProps<MatchParams>> = ({match}) => {
  const userInfoState = useSelector((state: RootState) => state.UserInfoReducer);
  const { city } = userInfoState;
  const itemState = useSelector((state:RootStateOrAny) => state.ItemReducer);
  const {items} = itemState;
  const dispatch = useDispatch();
  const [Count, setCount] = useState(6);
  //const [isVisibleModal, setIsVisibleModal] = useState(true);
 
  window.onpopstate = () => {
    
    if(match.params.keyword) {
      axios.get('https://localhost:4000/search',
        { params: { city: city, keyword: match.params.keyword, offset: 0 }})
        .then(res => {
          // 리덕스 상태 만들어서 응답으로 온 검색결과 저장하기
          dispatch(ItemHandler(getFormatedItems(res.data.items)));
          isChanged = true;
          setCount(6);
          console.log('search_뒤로가기_keyword', res.data.items);
        });
    }
    //2-(2) 검색 키워드가 없을때(처음 입장) 모든 자료 요청
    if(!match.params.keyword) {
      axios.get('https://localhost:4000/search',
        { params: { city: city, offset: 0}})
        .then(res => {
          // 리덕스 상태 만들어서 응답으로 온 검색결과 저장하기
          dispatch(ItemHandler(getFormatedItems(res.data.items))); //검색결과 받아서 리덕스에 저장
          setCount(6);
          isChanged = true;
          console.log('search_뒤로가기_no_keyword', res.data.items);
        });
    }
  };


  useEffect(() => {    
    if(match.params.keyword) {
      axios.get(`${process.env.REACT_APP_SERVER_ADDRESS}/search`,
        { params: { city: city, keyword: match.params.keyword, offset: 0 }})
        .then(res => {
          dispatch(ItemHandler(getFormatedItems(res.data.items)));
          setCount(6);
          isChanged = true;
          console.log('search_keyword', res.data.items);
        });
    }
    //2-(2) 검색 키워드가 없을때(처음 입장) 모든 자료 요청
    if(!match.params.keyword ) {
      axios.get(`${process.env.REACT_APP_SERVER_ADDRESS}/search`,
        { params: { city: city, offset: 0}})
        .then(res => {
          dispatch(ItemHandler(getFormatedItems(res.data.items))); //검색결과 받아서 리덕스에 저장
          setCount(6);
          isChanged = true;
          console.log('search_no_keyword', res.data.items);
        });
    }
  }, [city, match.params.keyword]);

  useEffect(() => {
    //3. socketio에 연결: 가격정보 수신 시 querySelector로 해당 부분의 가격을 변경한다.
    auctionSocket.on('bid', ({itemId, price, userId}: bidData) => {
      const newItems = items.map((item: Item) => {
        if(item.id === itemId) {
          item.winnerId = userId;
          item.price = price;
        }
        return item;
      });
      dispatch(ItemHandler({items: newItems}));
    });
    return () => {
      auctionSocket.off('bid');
    };
  }, [items]);

  // 인피니티 스크롤
  useEffect(() => {
    return () => {
      window.onscroll = null;
      window.onpopstate = null;
      isChanged = false; // 화면전환 로딩조건
    };
  }, []);

  window.onscroll = function() {
    //window height + window scrollY 값이 document height보다 클 경우,
    if((window.innerHeight + window.scrollY) >= document.body.offsetHeight * 0.8 && !oneTime) {
      //실행할 로직 (콘텐츠 추가)
      oneTime = true; // 중복요청하지 않게 조건변경
      setCount(Count + 6);
      axios.get(`${process.env.REACT_APP_SERVER_ADDRESS}/search`,
        { params: { city: city, offset: Count, keyword: match.params.keyword }})
        .then(res => {
          // 리덕스 상태 만들어서 응답으로 온 검색결과 저장하기
          oneTime = false; // 아이템 받아온 후 다시 요청가능하게 바꿈
          if (!res.data.items) {
            //dispatch(ItemHandler(getFormatedItems(items)));
          } else {
            const newItems = getFormatedItems(res.data.items); 
            dispatch(ItemHandler({ items: [...items, ...newItems.items]})); //검색결과 받아서 리덕스에 저장  
            console.log('search_onscroll', res.data.items);
          }
        });

    }
  };
  
  const emptyTitle = '검색 결과가 없어요 :(';
  const emptyText = '다른 검색어를 입력해보세요!';
  
  return (
    <div className="searchpage-container">
      { city && isChanged ? 
        items.length ? (items.map((item: Item) => 
          <ItemCard item={item} key={item.id}></ItemCard>
        )) : < Empty emptyTitle={emptyTitle} emptyText={emptyText}/>
        :
        <LoadingModal isLoading={true}/> 
      }
    </div>
  );
};

 

export default withRouter(SearchPage);

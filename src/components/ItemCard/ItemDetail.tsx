import React from 'react';
import {Item} from '../../redux/modules/Items';

import CurrentPrice from './CurrentPrice';
import Timer from './Timer';
import BidBtn from './BidBtn';
import './style/itemDetail.scss';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/modules/reducer';
// import closeButton from '../../res/closeButton.png';

interface Props {
  item: Item,
  requestBid: (price:number) => void,
  endtime: Date,
  handleBidStatus: (isClosed: boolean) => void,
  isExpired: boolean,
  closeCb: ()=> void,
}

const ItemDetail: React.FC<Props> = ({item, requestBid, endtime, handleBidStatus, isExpired, closeCb}) => {
  
  const unit1000 = 1000;
  const unit10000 = 10000;
  const unit100000 = 100000;
  const classname = 'itemdetail-time';
  const userInfoState = useSelector((state: RootState) => state.UserInfoReducer);
  const { id } = userInfoState;
  
  return (
    <section className="itemdetail">
      {/* <img className="itemdetail-close" src={closeButton} onClick={closeCb} alt=''></img> */}
      <article className="itemdetail-topbox">
        <h1 className="itemdetail-title">{item.title}</h1>
        <div className="itemdetail-imgbox"><img className="itemdetail-img" src={item.photo} alt=""/></div>
      </article>
      <article className="itemdetail-midbox">
        <div className="itemdetail-price"><span>현재가격: </span><span><CurrentPrice itemId={item.id} price={item.price}/></span></div>
        <div className="itemdetail-timer"><span>남은시간: </span><span><Timer classname={classname} endtime={endtime} handleBidStatus={handleBidStatus} /></span></div>
      </article>
      <div className="itemdetail-description">{item.description}</div>
      {id !== item.sellerId ? 
        <article className="itemdetail-btnbox"> 
          <BidBtn item={item} requestBid={requestBid} unit={unit1000} isExpired={isExpired}/>
          <BidBtn item={item} requestBid={requestBid} unit={unit10000} isExpired={isExpired}/>
          <BidBtn item={item} requestBid={requestBid} unit={unit100000} isExpired={isExpired}/>
        </article>
        :
        <div></div>
      }
        
    </section>
  );
};

export default ItemDetail;
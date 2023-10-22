// アプリケーション設定
// トースターのオプション設定
toastr.options ={
  tapToDismiss:false,
  timeOut:0,
  extendedTimeOut:0,
};

SQUARE_STATUS_IS_OWNED = "01";//自分が所有
SQUARE_STATUS_IS_OTHER = "02";//相手が所有
SQUARE_STATUS_NOT_SELECTED = "09";//選択されていない

// ターンを決めるための変数
let isOddTurn = true;

$(function(){
  // マス目にイベントを設置
  $(".square").click(clickSquareEvent);

  // リセットボタンを押した時のイベント
  $("#btn-initialize").click(initializeEvent);

  // 盤面の初期化
  initializeEvent();
});

function initializeEvent(){
  // ターン表示を削除
  toastr.remove();

  // マス目の属性をリセット
  $(".square")
    .removeClass("selected")
    .text("")
    .attr("data-owner","");

  // 奇数番手へ戻す
  isOddTurn = true;

  // 初期設定
  changeOwner(getTargetSquare(3,3));
  changeOwner(getTargetSquare(3,4));
  changeOwner(getTargetSquare(4,4));
  changeOwner(getTargetSquare(4,3));

  // トースターを表示
  toastr.info(getTurnString()+"の番です");
};

function clickSquareEvent(){
  // クリックされたマス目のオブジェクトを取得
  let square = $(this);

  // クリックされたマスが選択できない場合はスキップ
  if (!canSelect(square)){
    return;
  };

  // ターン表示を削除
  toastr.remove();

  // マス目にピースを置く
  changeOwner(square);

  // ゲーム終了
  if (isGameEnd()){
    toastEndMessage("ゲーム終了");
    return;
  }

  // 選択できるマスがないとき
  if (isPass()){
    // エラーメッセ
    toastr.remove();
    toastr.error(getTurnString()+"には選択できるマスがありません");

    // 次のターンへ
    changeTurn();
    if (isPass()){
      toastr.error(getTurnString()+"には選択できるマスがありません");
      toastEndMessage("選択できるマスがなくなりました");
    }else{
      setTimeout(function(){
        toastr.info(getTurnString()+"の番です");
      },1000);
    }
    return;
  }

  // トースターを表示
  toastr.info(getTurnString()+"の番です");
};

function putPiece(targetSquare, owner){
  targetSquare.text("⚫︎").attr("data-owner",owner).addClass("selected");
};

function getTurnString(){
  if (isOddTurn){
    return "black";
  }
  return "white";
};

function changeTurn(){
  isOddTurn = !isOddTurn;

  for (let elem of $(".square")){
    if (canSelect($(elem))){
      $(elem).addClass("can-select");
      $(elem).removeClass("cant-select");
    } else{
      $(elem).addClass("cant-select");
      $(elem).removeClass("can-select");
    }
  }
};

function changeOwner(square){
  // マス目にピースを置く
  putPiece(square,getTurnString());
  
  // ピースを反転
  changeOwnerOpposite(square);

  // ターンを変更
  changeTurn();
};

function getTargetSquare(row,col){
  return $("[data-row="+ row +"][data-col="+ col +"]");
};

// クリックできるマスか判定
function canSelect(square){
  if (square.hasClass("selected")){
    return false;
  }
  
  let row = square.data("row");
  let col = square.data("col");
  if (getPosOppositeLeft(row,col) != null){
    return true;
  }
  if (getPosOppositeRight(row,col) != null){
    return true;
  }
  if (getPosOppositeLower(row,col) != null){
    return true;
  }
  if (getPosOppositeUpper(row,col) != null){
    return true;
  }
  if (getPosOppositeUpperLeft(row,col) != null){
    return true;
  }
  if (getPosOppositeUpperRight(row,col) != null){
    return true;
  }
  if (getPosOppositeLowerLeft(row,col) != null){
    return true;
  }
  if (getPosOppositeLowerRight(row,col) != null){
    return true;
  }
  return false;
};

function changeOwnerOpposite(square){
  // クリックされた位置を把握
  let row = square.data("row");
  let col = square.data("col");

  // 所有者を変更する
  changeOwnerOppositeLower(row,col);//下
  changeOwnerOppositeUpper(row,col);//上

  changeOwnerOppositeLeft(row,col);//左
  changeOwnerOppositeRight(row,col);//右

  changeOwnerOppositeUpperLeft(row,col);//左上
  changeOwnerOppositeUpperRight(row,col);//右上
  changeOwnerOppositeLowerLeft(row,col);//左下
  changeOwnerOppositeLowerRight(row,col);//右下
};

function changeOwnerOppositeLower(row,col){
  let endPos = getPosOppositeLower(row,col);
  if (endPos == null){
    return;
  }

  let targetCol = col; 
  for (targetRow = row + 1;targetRow < endPos.row;targetRow++){
    let targetSquare = getTargetSquare(targetRow,targetCol);
    putPiece(targetSquare,getTurnString());
  }
};

function getPosOppositeLower(row,col){
  // 最下端の場合は対抗が存在しない
  if (row == 7){
    return null;
  }

  // 隣接するマスが相手所有ではない場合は対抗先が存在しない
  let targetRow = row +1;
  let targetCol = col;
  if (getSquareStatus(targetRow,targetCol) != SQUARE_STATUS_IS_OTHER){
    return null;
  }

  // 対抗の有無を判定
  for (targetRow++;targetRow <= 7;targetRow++){
    // マスの状態を取得
    let status = getSquareStatus(targetRow,targetCol);

    // 選択されていないマスに到達した場合は終了
    if (status == SQUARE_STATUS_NOT_SELECTED){
      return null;
    }

    // 自分が所有しているますに到達した場合、位置を返却
    if (status == SQUARE_STATUS_IS_OWNED){
      return {
        row:targetRow,
        col:targetCol,
      };
    }
  }
  return null;
}

function changeOwnerOppositeUpper(row,col){
  // 対抗を取得
  let endPos = getPosOppositeUpper(row,col);
  if (endPos == null){
    return;
  }

  // 対抗先まで所有者を変更する
  let targetCol = col; 
  for (targetRow = row - 1; endPos.row < targetRow ;targetRow--){
    let square = getTargetSquare(targetRow,targetCol);
    putPiece(square,getTurnString());
  }
};

function getPosOppositeUpper(row,col){
  // 最上端の場合は対抗が存在しない
  if (row == 0){
    return null;
  }

  // 隣接するマスが相手所有ではない場合は対抗先が存在しない
  let targetRow = row -1;
  let targetCol = col;
  if (getSquareStatus(targetRow,targetCol) != SQUARE_STATUS_IS_OTHER){
    return null;
  }

  // 対抗の有無を判定
  for (targetRow--; 0 <= targetRow;targetRow--){
    // マスの状態を取得
    let status = getSquareStatus(targetRow,targetCol);

    // 選択されていないマスに到達した場合は終了
    if (status == SQUARE_STATUS_NOT_SELECTED){
      return null;
    }

    // 自分が所有しているますに到達した場合、位置を返却
    if (status == SQUARE_STATUS_IS_OWNED){
      return {
        row:targetRow,
        col:targetCol,
      };
    }
  }
  return null;
}

function changeOwnerOppositeLeft(row,col){
  // 対抗を取得
  let endPos = getPosOppositeLeft(row,col);
  if (endPos == null){
    return;
  }

  // 対抗先まで所有者を変更する
  let targetRow = row; 
  for (targetCol = col - 1; endPos.col < targetCol ;targetCol--){
    let square = getTargetSquare(targetRow,targetCol);
    putPiece(square,getTurnString());
  }
};

function getPosOppositeLeft(row,col){
  // 最上端の場合は対抗が存在しない
  if (col == 0){
    return null;
  }

  // 隣接するマスが相手所有ではない場合は対抗先が存在しない
  let targetRow = row ;
  let targetCol = col - 1;
  if (getSquareStatus(targetRow,targetCol) != SQUARE_STATUS_IS_OTHER){
    return null;
  }

  // 対抗の有無を判定
  for (targetCol--; 0 <= targetCol;targetCol--){
    // マスの状態を取得
    let status = getSquareStatus(targetRow,targetCol);

    // 選択されていないマスに到達した場合は終了
    if (status == SQUARE_STATUS_NOT_SELECTED){
      return null;
    }

    // 自分が所有しているますに到達した場合、位置を返却
    if (status == SQUARE_STATUS_IS_OWNED){
      return {
        row:targetRow,
        col:targetCol,
      };
    }
  }
  return null;
}

function changeOwnerOppositeRight(row,col){
  // 対抗を取得
  let endPos = getPosOppositeRight(row,col);
  if (endPos == null){
    return;
  }

  // 対抗先まで所有者を変更する
  let targetRow = row; 
  for (targetCol = col + 1; endPos.col > targetCol ;targetCol++){
    let square = getTargetSquare(targetRow,targetCol);
    putPiece(square,getTurnString());
  }
};

function getPosOppositeRight(row,col){
  // 最上端の場合は対抗が存在しない
  if (col == 7){
    return null;
  }

  // 隣接するマスが相手所有ではない場合は対抗先が存在しない
  let targetRow = row ;
  let targetCol = col + 1;
  if (getSquareStatus(targetRow,targetCol) != SQUARE_STATUS_IS_OTHER){
    return null;
  }

  // 対抗の有無を判定
  for (targetCol++;  targetCol<= 7;targetCol++){
    // マスの状態を取得
    let status = getSquareStatus(targetRow,targetCol);

    // 選択されていないマスに到達した場合は終了
    if (status == SQUARE_STATUS_NOT_SELECTED){
      return null;
    }

    // 自分が所有しているますに到達した場合、位置を返却
    if (status == SQUARE_STATUS_IS_OWNED){
      return {
        row:targetRow,
        col:targetCol,
      };
    }
  }
  return null;
}

function changeOwnerOppositeUpperLeft(row,col){
  // 対抗を取得
  let endPos = getPosOppositeUpperLeft(row,col);
  if (endPos == null){
    return;
  }

  // 対抗先まで所有者を変更する
  for (
    targetRow = row - 1,targetCol = col - 1; 
    endPos.col < targetCol,endPos.row < targetRow ;
    targetCol--,targetRow--){
      let square = getTargetSquare(targetRow,targetCol);
      putPiece(square,getTurnString());
  }
};

function getPosOppositeUpperLeft(row,col){
  // 最上端の場合は対抗が存在しない
  if (col == 0 || row == 0){
    return null;
  }

  // 隣接するマスが相手所有ではない場合は対抗先が存在しない
  let targetRow = row - 1;
  let targetCol = col - 1;
  if (getSquareStatus(targetRow,targetCol) != SQUARE_STATUS_IS_OTHER){
    return null;
  }

  // 対抗の有無を判定
  for (
    targetCol--,targetRow--;  
    targetCol >= 0,targetRow >= 0;
    targetCol--,targetRow--){
      // マスの状態を取得
      let status = getSquareStatus(targetRow,targetCol);

      // 選択されていないマスに到達した場合は終了
      if (status == SQUARE_STATUS_NOT_SELECTED){
        return null;
      }

      // 自分が所有しているますに到達した場合、位置を返却
      if (status == SQUARE_STATUS_IS_OWNED){
        return {
          row:targetRow,
          col:targetCol,
        };
      }
  }
  return null;
}

function changeOwnerOppositeUpperRight(row,col){
  // 対抗を取得
  let endPos = getPosOppositeUpperRight(row,col);
  if (endPos == null){
    return;
  }

  // 対抗先まで所有者を変更する
  for (
    targetRow = row - 1,targetCol = col + 1; 
    endPos.col > targetCol,endPos.row < targetRow ;
    targetCol++,targetRow--){
      let square = getTargetSquare(targetRow,targetCol);
      putPiece(square,getTurnString());
  }
};

function getPosOppositeUpperRight(row,col){
  // 最上端の場合は対抗が存在しない
  if (col == 7 || row == 0){
    return null;
  }

  // 隣接するマスが相手所有ではない場合は対抗先が存在しない
  let targetRow = row - 1;
  let targetCol = col + 1;
  if (getSquareStatus(targetRow,targetCol) != SQUARE_STATUS_IS_OTHER){
    return null;
  }

  // 対抗の有無を判定
  for (
    targetCol++,targetRow--;  
    targetCol <= 7,targetRow >= 0;
    targetCol++,targetRow--){
      // マスの状態を取得
      let status = getSquareStatus(targetRow,targetCol);

      // 選択されていないマスに到達した場合は終了
      if (status == SQUARE_STATUS_NOT_SELECTED){
        return null;
      }

      // 自分が所有しているますに到達した場合、位置を返却
      if (status == SQUARE_STATUS_IS_OWNED){
        return {
          row:targetRow,
          col:targetCol,
        };
      }
  }
  return null;
}

function changeOwnerOppositeLowerLeft(row,col){
  // 対抗を取得
  let endPos = getPosOppositeLowerLeft(row,col);
  if (endPos == null){
    return;
  }

  // 対抗先まで所有者を変更する
  for (
    targetRow = row + 1,targetCol = col - 1; 
    endPos.col < targetCol,endPos.row > targetRow ;
    targetCol--,targetRow++){
      let square = getTargetSquare(targetRow,targetCol);
      putPiece(square,getTurnString());
  }
};

function getPosOppositeLowerLeft(row,col){
  // 最上端の場合は対抗が存在しない
  if (col == 0 || row == 7){
    return null;
  }

  // 隣接するマスが相手所有ではない場合は対抗先が存在しない
  let targetRow = row + 1;
  let targetCol = col - 1;
  if (getSquareStatus(targetRow,targetCol) != SQUARE_STATUS_IS_OTHER){
    return null;
  }

  // 対抗の有無を判定
  for (
    targetCol--,targetRow++;  
    targetCol >= 0,targetRow <= 7;
    targetCol--,targetRow++){
      // マスの状態を取得
      let status = getSquareStatus(targetRow,targetCol);

      // 選択されていないマスに到達した場合は終了
      if (status == SQUARE_STATUS_NOT_SELECTED){
        return null;
      }

      // 自分が所有しているますに到達した場合、位置を返却
      if (status == SQUARE_STATUS_IS_OWNED){
        return {
          row:targetRow,
          col:targetCol,
        };
      }
  }
  return null;
}

function changeOwnerOppositeLowerRight(row,col){
  // 対抗を取得
  let endPos = getPosOppositeLowerRight(row,col);
  if (endPos == null){
    return;
  }

  // 対抗先まで所有者を変更する
  for (
    targetRow = row + 1,targetCol = col + 1; 
    endPos.col > targetCol,endPos.row > targetRow ;
    targetCol++,targetRow++){
      let square = getTargetSquare(targetRow,targetCol);
      putPiece(square,getTurnString());
  }
};

function getPosOppositeLowerRight(row,col){
  // 最上端の場合は対抗が存在しない
  if (col == 7 || row == 7){
    return null;
  }

  // 隣接するマスが相手所有ではない場合は対抗先が存在しない
  let targetRow = row + 1;
  let targetCol = col + 1;
  if (getSquareStatus(targetRow,targetCol) != SQUARE_STATUS_IS_OTHER){
    return null;
  }

  // 対抗の有無を判定
  for (
    targetCol++,targetRow++;  
    targetCol <= 7,targetRow <= 7;
    targetCol++,targetRow++){
      // マスの状態を取得
      let status = getSquareStatus(targetRow,targetCol);

      // 選択されていないマスに到達した場合は終了
      if (status == SQUARE_STATUS_NOT_SELECTED){
        return null;
      }

      // 自分が所有しているますに到達した場合、位置を返却
      if (status == SQUARE_STATUS_IS_OWNED){
        return {
          row:targetRow,
          col:targetCol,
        };
      }
  }
  return null;
}

function getSquareStatus(row,col){
  // マスを取得
  let targetSquare = getTargetSquare(row,col);

  // selectedクラスを持っていなければ未選択
  if (!targetSquare.hasClass("selected")){
    return SQUARE_STATUS_NOT_SELECTED;
  }

  // 自分が所有している
  if (getTurnString() == targetSquare.attr("data-owner")){
    return SQUARE_STATUS_IS_OWNED;
  }

  // 相手が所有している
  return SQUARE_STATUS_IS_OTHER;
}

function isGameEnd(){
  if ($(".square.selected").length == 64){
    return true;
  }
  return false;
}

// ゲーム終了メッセ
function toastEndMessage(message){
  let countBlack = $("[data-owner=black]").length;
  let countWhite = $("[data-owner=white]").length;

  let judgeString = "black:"+countBlack+"<br/>"+"white:"+countWhite+"<br/>";

  // メッセージを表示
  if(countBlack == countWhite){
    toastr.success(message+"<br/>"+judgeString+"引き分け");
  } else if (countBlack < countWhite){
    toastr.success(message+"<br/>"+judgeString+"白の勝ち");
  }else {
    toastr.success(message+"<br/>"+judgeString+"黒の勝ち");
};
}

function isPass(){
  if ($(".square.can-select").length == 0){
    return true;
  }
  return false;
}
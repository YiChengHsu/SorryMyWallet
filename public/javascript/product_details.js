//Get product id from query
const query = location.search
const productId = query.split('=')[1]
const socket = io();

let leastBid;
let highestBidTimes;
let endTime;
let bidTimes;
let sellerId;

//Fetch the product details

const detailsUrl = `/api/1.0/product/details${query}`

fetch(detailsUrl)
    .then(res => res.json())
    .then(res =>  res.data)
    .then((data) => {
        

        if (data == null) {
            self.location.href = '/404.html'
        }

        const productTitle = document.querySelector('.my-product-title')
        productTitle.textContent = data.title

        const mainImage = document.querySelector('.main-image')
        mainImage.src = data.main_image

        endTime = data.end_time

        if (endTime < Date.now()) {
            $('#count-down-number').text('完結')
            const bidButton = document.querySelector('.my-bid-button')
            const bidInput = document.querySelector('.my-bid-input')
            $('.my-bid-button').attr('disabled', true)
            bidButton.disable = true;
            bidInput.readOnly = true;
            bidButton.className.remove = 'btn-primary'
            bidButton.className.add = 'btn-secondary'
            bidButton.textContent = "競標結束";

            if (data.highest_user_id == userId) {
                $('<div>', {
                    class: "col-12 alert alert-primary text-center my-alert" ,
                    role:"alert",
                    html: '您已成功得標，請前往<a href="/user/profile?type=order&status=0" class="alert-link">個人頁面</a>進行付款'
                }).prependTo('.main-row')
            }


        } else {
            setCountDownTimer(endTime) 
        }

        const currentNumber = document.querySelector('.highest-bid')
        currentNumber.textContent = data.highest_bid

        const bidEnter = document.querySelector('#my-bid-number')
        bidEnter.placeholder = `$${data.bid_incr}`

        const bidIncr = document.querySelector('#bid-incr')
        bidIncr.textContent = `最低出價增額： ${data.bid_incr}`
        leastBid = data.bid_incr;

        const bidTimesDiv = document.querySelector('#bid-times')
        highestBidTimes = data.bid_times
        bidTimesDiv.textContent = `出價次數： ${highestBidTimes}`

        sellerId = data.seller_id
        const sellerDiv = document.querySelector('#seller-id')
        sellerDiv.textContent = `賣家編號： ${sellerId}`

        if (userId == sellerId) {
            $('.my-bit-button').attr('disable', true).text('這是您的商品')
        }


        const bidRecords = document.querySelector('.my-bid-record')
        const recordsData = data.records || [];
        recordsData.reverse().map((e) => {
            renderBidRecord(e)
        })

        const description = document.querySelector('#description')
        description.textContent = `商品描述： ${data.description}`

        const texture = document.querySelector('#texture')
        texture.textContent = `商品材質： ${data.texture}`

        const condition = document.querySelector('#condition')
        condition.textContent = `商品狀況： ${data.condition}`

        const originalPackaging = document.querySelector('#original-packaging')
        originalPackaging.textContent = `原外包裝： ${data.original_packaging}`

        const withPapers = document.querySelector('#with-papers')
        withPapers.textContent = `商品相關證明： ${data.with_papers}`

        const place = document.querySelector('#place')
        place.textContent = `商品所在地點： ${data.place}`

        renderImagesSlide(data.images)


    })
;

//Get user information by token

//Join product id room with socket.io handshake
socket.emit('join', [productId, userId])

//Send bid message to socket.io server
const form = document.querySelector('#bid-form')
const input = document.querySelector('#my-bid-number')
const highestBid = document.querySelector('.highest-bid')
const bidRecords = document.querySelector('.my-bid-record')

form.addEventListener('submit', (e) => {
    e.preventDefault();

    const userBidIncr = Number(input.value)
    console.log(userBidIncr)
    if (!userBidIncr) {
        Swal.fire({
            icon: 'error',
            title: '無效出價',
            text: '出價欄位不得為空或包含無效字元',
        })
        return
    }

    if(!userId) {
        Swal.fire({
            icon: 'warning',
            title: '下標前請登入',
            text: '登入以享受更多競標的樂趣！',
        }) 
        .then(() => {
            self.location.href = "/user/signin"
        })
        return
    } 

    if(userId == sellerId) {
        Swal.fire({
            icon: 'warning',
            title: '請勿自行下標',
            text: '自己的轎不能自己抬唷！',
        })
        return
    }

    if (userBidIncr < leastBid) {
        Swal.fire({
            icon: 'error',
            title: '無效出價',
            text: '請不要小於最低出價增額',
        })
        return
    } else if (userBidIncr > leastBid*100) {
        Swal.fire({
            icon: 'warning',
            title: '太多啦~',
            text: '珍惜荷包，請不要大於出價增額的一百倍',
        }) 
        return
    }

    const currentAmount = highestBid.textContent
    const userBidAmount = Number(highestBid.textContent.replace("$","")) + userBidIncr

    Swal.fire({
        title: "確認出價",
        html: `<p>最高價：<br><b>$${currentAmount}</b></p><p>即將出價：<br><b>$${userBidAmount}</b></p>`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#e95420",
        confirmButtonText: "我跟他拚了！",
        cancelButtonText: "怕.jpg",
    }).then((result) => {
        if (result.isConfirmed) {
            socket.emit('bid', { productId, userId, userBidAmount, endTime, highestBidTimes}) 
        } else if (result.dismiss === Swal.DismissReason.cancel) {
            input.value = ''
        }
    })
})

//Get message from server
socket.on(`refresh_${productId}`, bidRecord => {

    console.log(bidRecord)

    const highestBid = document.querySelector('.highest-bid')
    highestBid.textContent = bidRecord.bid_amount

    const bidTimesDiv = document.querySelector('#bid-times')
    highestBidTimes = bidRecord.highest_bid_times
    bidTimesDiv.textContent = `出價次數： ${highestBidTimes}`

    endTime = bidRecord.end_time
    resetCountDownTimer()
    renderBidRecord(bidRecord)

})

socket.on('bidFail', (message) => {
    Swal.fire({
        icon: 'error',
        title: '出價失敗',
        text: message,
        confirmButtonText: '知道了'
    })
})

socket.on('bidSuccess', bidRecord => {
    Swal.fire({
        icon: 'success',
        title: '出價成功',
        text: '您目前是最高出價者',
    })
    .then(()=>{
        input.value = ''
    })
})


//Output bid message to DOM
const renderBidRecord = (record) => {
    const bidTime = transMilToDate(record.bid_time + 8*60*60*1000)
    const timeLeft = transMilToDate(record.time_left)

    let recordLi = document.createElement('li')
    recordLi.className = "list-group-item d-flex justify-content-between align-items-start record-message"

    let recordDiv = document.createElement('div')
    recordDiv.className = "ms-2 me-auto"
    recordDiv.textContent =  `$${record.bid_amount}`
    
    let subDiv = document.createElement('div')
    subDiv.className = 'fw-bold fs-6'
    subDiv.textContent = `${record.user_id}號買家舉起了號碼牌`
    
    
    let recordSpan = document.createElement('span')
    recordSpan.className = "badge bg-secondary rounded-pill fs-6"
    recordSpan.textContent = `${bidTime.hours}: ${bidTime.min}: ${bidTime.sec}`

    recordDiv.appendChild(subDiv)
    recordLi.appendChild(recordDiv)
    recordLi.appendChild(recordSpan)
    bidRecords.prepend(recordLi)

    const messages = document.querySelectorAll('.record-message')

    messages.forEach(e => e.classList.remove('fs-2'))
    messages[0].classList.add('fs-2')

    if(messages.length > 5) {
        bidRecords.removeChild(messages[5])
    }
}

//Output other image with bootstrap Carousel
const renderImagesSlide = (otherImages) => {
    
    let indicators = document.querySelector('.carousel-indicators')
    let carousel = document.querySelector('.carousel-inner')

    otherImages.forEach((e, i) => {

        indicators.innerHTML += `<button type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide-to="${(i+1)}" aria-label="Slide ${(i+2)}"></button>`

        carouselItem = document.createElement('div')
        carouselItem.className = "carousel-item"

        carouselImg = document.createElement('img')
        carouselImg.className = "d-block w-100 other-images"
        carouselImg.src = e

        carouselItem.appendChild(carouselImg)
        carousel.appendChild(carouselItem)

    })
} 


const setCountDownTimer = () => {
    setInterval(() => {
        let start = Date.now();
        //Convert to timestamp
        let totalMilSec = (endTime) - Date.now();
        const countDown = document.querySelector('#count-down-number')

        if (totalMilSec <= 0) {
            countDown.textContent = "完結"
            const bidButton = document.querySelector('.my-bid-button')
            const bidInput = document.querySelector('.my-bid-input')
            bidButton.disable = true;
            bidInput.readOnly = true;
            bidButton.className = ''
            bidButton.textContent = "競標結束";
            return
        }

        let time = transMilToDate(totalMilSec)

        countDown.textContent = `${time.days}:${time.hours}:${time.min}:${time.sec} `
    },500)
}

const resetCountDownTimer = () => {
    clearInterval(setCountDownTimer);
    setCountDownTimer(endTime);
}

const transMilToDate = (totalMilSec) => {
    let milSec = totalMilSec % 1000
    let sec = fixTime(Math.floor((totalMilSec/1000) % 60))
    let min = fixTime(Math.floor((totalMilSec/1000/60) % 60))
    let hours = fixTime(Math.floor((totalMilSec/(1000*60*60)) % 24))
    let days = Math.floor(totalMilSec/(1000*60*60*24));

    return { milSec, sec, min, hours, days}
}

const fixTime = (time) => {
    if(time < 10) {
        return `0${time}`
    } else {
        return time;
    }
}



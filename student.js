$(function(){

    var pubnub,channel,mode,nicknameStudent,teamColor,nameColor,result;
    var timeAnswer = 0;
    var t_interval;
    var channelInputLeaderboard = 'leaderboard-channel-input';
    var hover = true;
    var starCount,thumbsType,faceType,allotedTime;
    var missedDeadline =true;

    $('#frm_joint_student').submit(function(){
        $('#btn_joint_student').button('loading');
        channel = $('#game-pin').val();
        pubnub = new PubNub({
            subscribeKey: "sub-c-b5732f80-4ccf-11e6-8b3b-02ee2ddab7fe",
            publishKey: "pub-c-8e45f540-691c-4e55-9f07-f2278795ec3d",
            ssl: true,
            //uuid:'eleve-'+ Math.floor(Math.random() * 99 + 1),
            presenceTimeout: 120,
            heartbeatInterval: 30
        });


        isOnline(channel,function(response){
            console.log(response);
            if(response){
                $('#frm_joint_student').hide('200',function(){
                    $('#frm_nickname_student').show(200);
                });
            }else{
                alert('Session not found');
                location.reload();
            }
        });
        return false;
    });



    $('#frm_nickname_student').submit(function(){
        $('#btn_nickname_student').button('loading');
        nicknameStudent = $('#nickname-student').val();

        //alert(nicknameStudent);

        isNicknameExist(channel,function(response){
            if (response.length <= 0) {
                alert('Session failed not response..!');
                location.reload();
            }else{
                //console.log(response);
                $.each(response,function(index,value){
                    if(value.uuid === 'moderator'){

                        //pubnub.setUUID(nicknameStudent);

                        if(!value.state){
                            mode = "A";
                            nicknameStudent = [nicknameStudent, channel].join('-');

                            if(userExists(response,nicknameStudent)){
                                alert('Nickname exist..!!');
                                $('#btn_nickname_student').button('reset');

                            }else{
                                pubnub.setUUID(nicknameStudent);
                                ready(channel);
                                $('#frm_nickname_student').hide('200',function(){
                                    $('#yourIn').show(200);
                                });
                            }


                        }else if (value.state.modeType === 'B'){

                            mode = "B";
                            result = response;
                            var listTeamsColor = value.state.listTeamsColor;
                            $.each(listTeamsColor, function (index, value) {
                                $('#color-student').append($('<option>', {
                                    value: value.teamColor,
                                    text: value.nameColor
                                }));
                            });
                            $('#frm_nickname_student').hide('200', function () {
                                $('#frm_color_student').show(200);
                            });
                        }
                    }
                });
            }
        });
        return false;
    });





    /*------------------------------------Submit team player------------------------------*/
    $('#frm_color_student').submit(function(){
        teamColor = $('#color-student').val();
        nameColor = $("#color-student :selected").text();

        nicknameStudent = [nicknameStudent, channel, nameColor].join('-');

        if(userExists(result,nicknameStudent)){

            $('#btn_nickname_student').button('reset');
            $('#frm_color_student').hide('200', function () {
                $('#frm_nickname_student').show(200);
            });

            alert('Nickname exist in this team..!! chose other team or other nickname');



        }else{

            pubnub.setUUID(nicknameStudent);
            ready(channel);
            $('#frm_nickname_student').hide('200',function(){
                $('#yourIn').show(200);
            });
        }

        return false;
    });

    $('body').on('click','.choice-question',function(event){
        missedDeadline = false;
        var data;
        var btn = $(event.currentTarget);
        var answerPlayer = btn.attr('data-id');

        $('.choice-question').hide();

        timeAnswer--;

        if(timeAnswer < 0){
            timeAnswer = 0;
        }

        if(mode === "A"){
            data = {nicknameStudent : nicknameStudent , answerPlayer : answerPlayer,timeAnswer : timeAnswer ,outputChannel: channel };
        }else{
            /*data = {nicknameStudent : nicknameStudent , answerPlayer : answerPlayer ,timeAnswer : timeAnswer ,outputChannel: channel,
             modeType : mode, teamColor : teamColor, nameColor :nameColor};*/

            data = {nicknameStudent : nicknameStudent , answerPlayer : answerPlayer ,timeAnswer : timeAnswer ,outputChannel: channel,
                modeType : mode, teamColor : teamColor};
        }


        pubnub.fire(
            {
                message: data,
                channel: channelInputLeaderboard,
                sendByPost: false // true to send via post
            },
            function (status, response) {
                if (status.error) {
                    // handle error
                    console.log(status);
                    alert('error verify connection..!');
                }else{
                    //console.log(status);
                    console.log('timeAnswer '+timeAnswer);
                    stopCount();
                }
            }
        );



    });


    $('body').on('mouseover','.fa-star',function(event){
    //$('.glyphicon-star').click(function(){
        //console.log('ok');
        if(hover) {
            var pos = parseInt($(this).attr('data-id'));
            //console.log(pos);
            for (var i = 1; i <= pos; i++) {
                //console.log(i);
                $('#star-' + i).css('color', '#eb670f');
            }
        }
    });

    $('body').on('mouseout','.fa-star',function(event){
        if(hover) {
            $('.fa-star').css('color', '#aeaeae');
        }
    });


    $('body').on('click','.fa-star',function(event){
        hover = false;
        starCount = parseInt($(this).attr('data-id'));
        $('.fa-star').css('color', '#aeaeae');
        //console.log('starCount : '+starCount);
        for(var i = 1; i<=starCount;i++){
            //console.log(i);
            $('#star-'+i).css('color','#eb670f');
        }
    });

    $('body').on('click','.thumbs',function(event){
        thumbsType = $(this).attr('data-id');
        $('.thumbs').removeClass('bigFont');
        $(this).addClass('bigFont')

        //console.log('thumbsType : '+thumbsType);

    });

    $('body').on('click','.face',function(event){
        faceType = $(this).attr('data-id');
        //console.log('faceType : '+faceType);

        var data ={response : 'sendFeedback',starCount : starCount, thumbsType : thumbsType, faceType : faceType};
        $('#content').html('<h1>Game Over</h1>');
        pubnub.publish(
            {
                message: data,
                channel: channel,
                sendByPost: false // true to send via post
            },
            function (status, response) {
                if (status.error) {
                    // handle error
                    console.log(status);
                    alert('error verify connection..!');
                }
            }
        );

    });


    function ready(ch) {

        pubnub.addListener({
            status: function (statusEvent) {
                if (statusEvent.category === "PNConnectedCategory") {
                    if (mode === "B"){
                        var newState = {teamColor: teamColor};
                        pubnub.setState(
                            {
                                state: newState,
                                channels: [channel]
                            },
                            function (status) {
                                console.log(status);
                                $('#frm_color_student').hide('200',function(){
                                    $('#yourIn').show(200);
                                });
                            }
                        );
                    }
                }
            },
            message: function (m) {
                //console.log(m);

                var message = m.message;

                switch (message.response){
                    case 'send_quiz':
                        missedDeadline = true;
                        allotedTime = parseInt(message.time);
                        $('#content').html('<div id="content-questions" class="container-fluid row" style="display: none"></div>')
                        for(var i=1; i <= message.totalAnswers; i++){
                            $('#content-questions').append('' +
                                '<div class="col-xs-6"><div data-id="'+i+'" class="choice-question"><h1>Answer '+i+'' +
                                '</h1></div></div>');
                        }

                        countdown(5);




                        break;

                    case 'send_attachment':
                        $('#content').html('<h1>show attachment</h1>');
                        break;

                    case 'game_state':


                        if(message.myUser == nicknameStudent) {
                            var PtSlide = message.PtSlide || 0;
                            //var timeSlide = allotedTime*1000;
                            //console.log(timeSlide);
                            //$('#content').html('<h1>waiting result...!</h1>');

                            /*setTimeout(function(){
                                if (message.correct) {
                                    $('#content').html('<h1>Correct</h1><h1>point : +'+PtSlide+'</h1><h1>Total Score : ' + message.score + '</h1>');
                                } else {
                                    $('#content').html('<h1>Incorrect</h1><h1>point : +'+PtSlide+'</h1><h1>Total Score : ' + message.score + '</h1>');
                                }
                            },timeSlide);*/

                            if (message.correct) {
                                $('#content').html('<h1>Correct</h1><h1>point : +'+PtSlide+'</h1><h1>Total Score : ' + message.score + '</h1>');
                            } else {
                                $('#content').html('<h1>Incorrect</h1><h1>point : +'+PtSlide+'</h1><h1>Total Score : ' + message.score + '</h1>');
                            }

                        }
                        break;

                    case 'getFeedback':
                        //console.log('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
                        $('#content').html('<h3 class="feedback-question">Did you learn something?</h3><h1><span class="fa fa-thumbs-up thumbs" data-id="like"></span>' +
                            '<span class="fa fa-thumbs-down thumbs" data-id="dislike"></span></h1>' +
                            '<h3 class="feedback-question">How do you rate this Quiz?</h3><h1><span id="star-1" data-id="1" class="fa fa-star"></span>' +
                            '<span id="star-2" data-id="2" class="fa fa-star"></span><span id="star-3" data-id="3" class="fa fa-star"></span>' +
                            '<span id="star-4" data-id="4" class="fa fa-star"></span><span id="star-5" data-id="5" class="fa fa-star"></span></h1>' +
                            '<h3 class="feedback-question">To continue, tell us how you feel?</h3><h1><span class="fa fa-smile-o face" data-id="smile" aria-hidden="true"></span>' +
                            '<span class="fa fa-meh-o face" data-id="meh" aria-hidden="true"></span><span class="fa fa-frown-o face" data-id="frown" aria-hidden="true"></span></h1>');
                }
            },
            presence: function (presenceEvent) {
                //console.log(presenceEvent);
                if(presenceEvent.uuid === 'moderator'){

                    if(presenceEvent.action === 'leave'){
                        location.reload();
                    }

                    if(presenceEvent.action === 'timeout'){
                        location.reload();
                    }


                }
            }
        });

        pubnub.subscribe({
            channels: [ch],
            withPresence: true // also subscribe to presence instances.
        });



    }



    var timerId;
    function countdown(countr) {
        var count = countr;
        var numberCircle = '#numberCircle';

        $(numberCircle).text(''+count);
        $(numberCircle).show();

        timerId = setInterval(function() {
            count--;
            //console.log(count);
            $(numberCircle).text(''+count);


            if(count == 0){
                clearInterval(timerId);
                $(numberCircle).hide();
                $('#content-questions').show();
                startCount();


                var time = allotedTime*1000;
                setTimeout(function(){
                    if(missedDeadline){
                        $('#content-questions').html('<h1>missed deadline</h1>');
                    }

                },time);
            }
        }, 1000);
    }



    function isOnline(number,cb){
        pubnub.hereNow(
            {
                channels: [number],
                includeUUIDs: true,
            },
            function (status, response) {
                // handle status, response
                //console.log(status);
                //console.log(response);
                //cb(response.channels[channel].occupants);
                cb(response.totalOccupancy != 0);
            }
        );
    }


    function isNicknameExist(number,cb){
        pubnub.hereNow(
            {
                channels: [number],
                includeUUIDs: true,
                includeState: true
            },
            function (status, response) {
                //console.log(response);
                cb(response.channels[channel].occupants);
            }
        );
    }

    function userExists(arr,uuid) {
        return arr.some(function(el) {
            return el.uuid === uuid;
        });
    }



    function timedCount() {
        timeAnswer = timeAnswer + 1;
        //console.log(timeAnswer);
        t_interval = setTimeout(function(){ timedCount() }, 1000);
    }
    function startCount() {
        if (!timeAnswer) {
            timedCount();
        }
    }
    function stopCount() {
        clearTimeout(t_interval);
        timeAnswer = 0;
    }


});

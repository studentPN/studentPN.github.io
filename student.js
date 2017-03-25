$(function(){

    var pubnub,channel;

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
        var nicknameStudent =$('#nickname-student').val();

        isNicknameExist(channel,function(response){
            if (response.length <= 0) {
                alert('Session failed not response..!');
                location.reload();
            }else{
                if(userExists(response,nicknameStudent)){
                    alert('Nickname exist..!!');
                    $('#btn_nickname_student').button('reset');
                }else{

                    $.each(response,function(index,value){
                        if(value.uuid === 'moderator'){

                            pubnub.setUUID(nicknameStudent);

                            if(!value.state){
                                $('#frm_nickname_student').hide('200',function(){
                                    $('#yourIn').show(200);
                                });

                            }else if (value.state.modeType === 'B'){

                                var listTeamsColor = value.state.listTeamsColor;

                                $.each(listTeamsColor , function(index,value){
                                    $('#color-student').append($('<option>', {
                                        value: value.teamColor,
                                        text: value.teamColorText
                                    }));
                                });
                                
                                $('#frm_nickname_student').hide('200',function(){
                                    $('#frm_color_student').show(200);
                                });
                            }
                            ready(channel);
                        }
                    });
                }
            }
        });
        return false;
    });



    $('#frm_color_student').submit(function(){
        var teamColor = $('#color-student').val();
        //var teamColorText = $("#color-student :selected").text();
        if (teamColor){
            var newState = {teamColor: teamColor};
            pubnub.setState(
                {
                    state: newState,
                    channels: [channel]
                },
                function (status) {
                    // handle state setting response
                    console.log(status);

                    $('#frm_color_student').hide('200',function(){
                        $('#yourIn').show(200);
                    });
                }
            );
        }
        return false;
    });


    function ready(ch) {

        pubnub.addListener({
            status: function (statusEvent) {
                if (statusEvent.category === "PNConnectedCategory") {

                }
            },
            message: function (message) {
                console.log(message);
            },
            presence: function (presenceEvent) {
                console.log(presenceEvent);
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

    function isOnline(number,cb){
        pubnub.hereNow(
            {
                channels: [number],
                includeUUIDs: true,
            },
            function (status, response) {
                // handle status, response
                //console.log(status);
                console.log(response);
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
                console.log(response);
                cb(response.channels[channel].occupants);
            }
        );
    }

    function userExists(arr,uuid) {
        return arr.some(function(el) {
            return el.uuid === uuid;
        });
    }
});

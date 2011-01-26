var db;
var jQT = $.jQTouch({
	icon: '../../icon.png',
	startupScreen: 'startup.png',
	statusBar: 'blue'
});

$(document).ready(function() {
	jQT.resetHeight();
    $('#createEntry form').submit(createEntry);
    $('#settings form').submit(saveSettings);
    $('#settings').bind('pageAnimationStart', loadSettings);
    $('#home li a').click(function(){
        var dayOffset = this.id;
        var date = new Date();
        date.setDate(date.getDate() - dayOffset);
        sessionStorage.currentDate = date.getDate() + '/' + date.getMonth() + 1 + '/' + date.getFullYear();
        refreshEntries();
        
    });
    var currentDate = sessionStorage.currentDate;
    $('#home h1').text('SisCB - '+currentDate);
    var shortName = 'sisCB';
    var version = '1.0';
    var displayName = 'sisCB';
    var maxSize = 33554432;
    db = openDatabase(shortName, version, displayName, maxSize);
    db.transaction(
        function(transaction) {
            transaction.executeSql(
                'create table if not exists requerimentos(id integer not null primary key autoincrement,dv integer,ano integer,cep varchar(150),cidade varchar(150),razao varchar(150),cnpj varchar(150),fantasia varchar(150),endereco varchar(150),referencia varchar(150),fone varchar(150),proprietario varchar(150),cpf varchar(150),atividade varchar(150),tipo varchar(150),area_construida varchar(150),area_vistoriada varchar(150),tipo_construcao varchar(150),requer varchar(150),obs longvarchar,espaco_cb longvarchar,created varchar(150),modified varchar(150),user_id integer);'
            );
            transaction.executeSql(
            	'create table if not exists users(id integer not null primary key autoincrement,nome varchar(25),senha varchar(25)); '
            );
            transaction.executeSql(
            	'create table if not exists vistorias(id integer not null primary key autoincrement,requerimento_id integer,nib integer,finalidade varchar(2),tipo integer,data_agendada date,tipo_ocupacao integer,solicitante integer,andar integer,qtd_pav integer,area_total integer,area_vistoria integer,grau_risco integer,n_ppi varchar(255),n_glp varchar(255),alvara integer,c_001_01 char(1),c_001_02 char(1),c_001_03 char(1),c_001_04 char(1),c_001_05 char(1),c_002_06 char(1),c_002_07 char(1),c_002_08 char(1),c_002_09 char(1),c_002_10 char(1),c_002_11 char(1),c_002_12 char(1),c_002_13 char(1),c_003_14 char(1),c_003_15 char(1),c_003_16 char(1),c_003_17 char(1),c_003_18 char(1),c_003_19 char(1),c_003_19_det varchar(200),c_003_20 char(1),c_003_21 char(1),c_003_22 char(1),c_003_23 char(1),c_003_24 char(1),c_003_25 char(1),c_003_26 char(1),c_003_27 char(1),c_003_28 char(1),c_003_29 char(1),c_003_30 char(1),c_003_31 char(1),c_004_32 char(1),c_004_33 char(1),c_004_33_det_ex varchar(200),c_004_33_det_kg varchar(200),c_004_33_det_no varchar(200),c_004_34 char(1),c_004_34_det_ex varchar(200),c_004_34_det_kg varchar(200),c_004_34_det_no varchar(200),c_004_35 char(1),c_004_35_det_ex varchar(200),c_004_35_det_no varchar(200),c_004_36 char(1),c_004_36_det_no varchar(200),c_004_37 char(1),c_004_38 char(1),c_004_39 char(1),c_004_40 char(1),c_004_40_det_no varchar(200),c_004_41 char(1),c_004_41_det_no varchar(200),c_005_42 char(1),c_005_43 char(1),c_005_44 char(1),c_005_44_det_1 char(1),c_005_44_det_2 char(1),c_005_45 char(1),c_005_46 char(1),c_005_46_det_no varchar(200),c_005_47 char(1),c_005_47_det_em varchar(200),c_005_48 char(1),c_005_49 char(1),c_005_50 char(1),c_005_51 char(1),c_005_52 char(1),c_005_52_det_ao varchar(200),c_005_53 char(1),c_005_54 char(1),c_005_55 char(1),c_005_56 char(1),c_005_57 char(1),c_006_58 char(1),c_006_58_det varchar(64),c_006_59 char(1),c_006_59_det varchar(64),c_006_60 char(1),c_006_60_det varchar(64),c_006_61 char(1),c_006_61_det varchar(64),c_006_62 char(1),c_006_62_det varchar(64),c_006_63 char(1),c_006_63_det varchar(64),c_006_64 char(1),c_006_64_det varchar(64),c_006_65 char(1),c_006_65_det varchar(64),assinatura varchar(255))'
            );
        }
    );
});

function saveSettings() {
    localStorage.age = $('#age').val();
    localStorage.budget = $('#budget').val();
    localStorage.weight = $('#weight').val();
    jQT.goBack();
    return false;
}

function loadSettings() {
    $('#age').val(localStorage.age);
    $('#budget').val(localStorage.budget);
    $('#weight').val(localStorage.weight);
}

function refreshEntries() {
    $('#reqs ul li:gt(0)').remove();
    db.transaction(
        function(transaction) {
            transaction.executeSql(
                'SELECT id, dv, ano, endereco FROM requerimentos;',
                [ ],
                function (transaction, result) {
                    for (var i=0; i < result.rows.length; i++) {
                        var row = result.rows.item(i);
                        var newEntryRow = $('#Template').clone();
                        newEntryRow.removeAttr('id');
                        newEntryRow.removeAttr('style');
                        newEntryRow.data('entryId', row.id);
                        newEntryRow.appendTo('#reqs ul');
                        newEntryRow.find('.id').text(row.id+'/');
                        newEntryRow.find('.dv').text(row.dv+'/');
                        newEntryRow.find('.ano').text(row.ano+' - ');
                        newEntryRow.find('.endereco').text(row.endereco);
                        newEntryRow.find('.delete').click(function(){
                            var clickedEntry = $(this).parent();
                            var clickedEntryId = clickedEntry.data('entryId');
                            deleteEntryById(clickedEntryId);
                            clickedEntry.slideUp();
                        });
                    }
                },
                errorHandler
            );
        }
    );
}
function createEntry() {
    var date = sessionStorage.currentDate;
    var calories = $('#calories').val();
    var food = $('#food').val();
    db.transaction(
        function(transaction) {
            transaction.executeSql(
                'INSERT INTO entries (date, calories, food) VALUES (?, ?, ?);',
                [date, calories, food],
                function(){
                    refreshEntries();
                    jQT.goBack();
                },
                errorHandler
            );
        }
    );
    return false;
}

function errorHandler(transaction, error) {
    alert('Oops. Ocorreu um erro '+error.message+' (Cód. '+error.code+')');
    return true;
}

function deleteEntryById(id) {
    db.transaction(
        function (transaction) {
            transaction.executeSql('DELETE FROM entries WHERE id=?;', [id], null, errorHandler);
        }
    );
}

'use strict';

// هذا الملف هو نقطة دخول الـ chaincode.
// Hyperledger Fabric يبحث عن العقود المصدرة من هنا عند تشغيل الـ smart contract.
const MessageBoardContract = require('./lib/messageBoardContract');

// نخبر Fabric أن العقد المتاح اسمه MessageBoardContract.
module.exports.contracts = [MessageBoardContract];

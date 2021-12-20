const anchor = require('@project-serum/anchor');
const serumCmn = require("@project-serum/common");
const { TOKEN_PROGRAM_ID, Token, ASSOCIATED_TOKEN_PROGRAM_ID } = require("@solana/spl-token");
const _ = require('lodash')
const { BN, web3, Program, ProgramError, Provider } = anchor
const { PublicKey, SystemProgram, Keypair, Transaction } = web3
const assert = require("assert");
const utf8 = anchor.utils.bytes.utf8;
const provider = anchor.Provider.local()

const stakingIdl = require('../target/idl/waggle_staking.json');

const { expect } = require('chai');
const { Connection } = require('@solana/web3.js');

const errorProvider = (idl) => {
  const errors = parseIdlErrors(idl)
  const wrapError = async (fn) => {
    try {
      if (typeof fn === 'function')
        await fn()
      else
        await fn
    } catch (error) {
      let translatedErr
      if (error instanceof ProgramError) {
        translatedErr = error
      } else {
        translatedErr = ProgramError.parse(error, errors)
      }
      if (translatedErr === null) {
        let code = error.message
        code = code.substr(code.indexOf('"Custom":') + '"Custom":'.length)
        code = code.substr(0, code.indexOf('}]}})'))
        translatedErr = ProgramError.parse(`custom program error: ${code}`, errors)
      }

      if (translatedErr === null) {
        throw error
      } else {
        console.log(`ErrCode=${translatedErr.code} msg=${translatedErr.msg}`)
      }
      throw translatedErr
    }
  }
  const assertError = async (fn, msg) => {
    try {
      await wrapError(fn)
    } catch (error) {
      if (!error.msg) throw error
      assert(error.msg === msg, `Expect ${msg} but got ${error.msg}`)
    }
  }
  return { wrapError, assertError }
}

function parseIdlErrors (idl) {
  const errors = new Map();
  if (idl.errors) {
    idl.errors.forEach((e) => {
      let msg = e.msg ?? e.name;
      errors.set(e.code, msg);
    });
  }
  return errors;
}

const stakingError = errorProvider(stakingIdl)

const { assertError, wrapError, } = stakingError

module.exports = {
  assertError, wrapError, stakingError
}
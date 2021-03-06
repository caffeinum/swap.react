import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'

import { connect } from 'redaction'
import actions from 'redux/actions'

import { isMobile } from 'react-device-detect'

import cssModules from 'react-css-modules'
import styles from './Row.scss'

import { links, constants } from 'helpers'
import { Link, Redirect } from 'react-router-dom'

import Avatar from 'components/Avatar/Avatar'
import InlineLoader from 'components/loaders/InlineLoader/InlineLoader'
import { Button, RemoveButton } from 'components/controls'

import Pair from '../Pair'
import PAIR_TYPES from 'helpers/constants/PAIR_TYPES'
import RequestButton from '../RequestButton/RequestButton'
import { FormattedMessage, injectIntl } from 'react-intl'
import { localisedUrl } from 'helpers/locale'


@injectIntl
@connect({
  peer: 'ipfs.peer',
})
@cssModules(styles)
export default class Row extends Component {

  static propTypes = {
    row: PropTypes.object,
  }

  state = {
    balance: 0,
    windowWidth: 0,
    isFetching: false,
    enterButton: false,

  }

  componentDidMount() {
    window.addEventListener('resize', this.renderContent)
    this.renderContent()
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.renderContent)
  }

  componentWillMount() {
    const { row: {  sellCurrency, isMy, buyCurrency } } = this.props
    if (isMy) {
      this.checkBalance(sellCurrency)
    } else {
      this.checkBalance(buyCurrency)
    }
  }

  checkBalance = async (currency) => {
    const balance = await actions[currency.toLowerCase()].getBalance(currency)

    this.setState({
      balance,
    })
  }

  handleGoTrade = async (currency) => {
    const balance = await actions.eth.getBalance()
    return (balance >= 0.005 || currency.toLowerCase() === 'eos')
  }

  removeOrder = (orderId) => {
    if (confirm('Are your sure ?')) {
      actions.core.removeOrder(orderId)
      actions.core.updateCore()
    }
  }

  sendRequest = async (orderId, currency) => {
    const check = await this.handleGoTrade(currency)

    this.setState({ isFetching: true })

    setTimeout(() => {
      this.setState(() => ({ isFetching: false }))
    }, 15 * 1000)

    actions.core.sendRequest(orderId, {}, (isAccepted) => {
      console.log(`user has ${isAccepted ? 'accepted' : 'declined'} your request`)

      if (isAccepted) {
        this.setState({ redirect: true, isFetching: false })
      }
      else {
        this.setState({ isFetching: false })
      }
    })
    actions.core.updateCore()
  }

  renderWebContent() {
    const { balance, isFetching } = this.state
    const {
      peer,
      orderId,
      row: {
        id,
        isMy,
        buyAmount,
        sellAmount,
        buyCurrency,
        isRequested,
        isProcessing,
        sellCurrency,
        owner: {  peer: ownerPeer },
      },
      intl: { locale },
    } = this.props

    const pair = Pair.fromOrder(this.props.row)

    const { price, amount, total, main, base, type } = pair

    return (
      <tr style={orderId === id ? { background: 'rgba(0, 236, 0, 0.1)' } : {}}>
        <td>
          <Avatar
            value={ownerPeer}
            size={45}
          />
        </td>
        <td>
          <span style={{ color: 'gray' }}>
            {type === PAIR_TYPES.BID ? 'buys' : 'sells'}
          </span>
          {' '}
          {
            `${amount.toFixed(5)} ${main}`
          }
        </td>
        <td>
          <span style={{ color: 'gray' }}>
            <FormattedMessage
              id="Row1511"
              defaultMessage={`at price {price}`}
              values={{
                price: `${price.toFixed(5)} ${base}`,
              }} />
          </span>
        </td>
        <td>
          <span style={{ color: 'gray' }}>
            <FormattedMessage
              id="Row159"
              defaultMessage={`for {total}`}
              values={{
                total: `${total.toFixed(5)} ${base}`,
              }}
            />
          </span>
        </td>
        <td>
          {
            peer === ownerPeer ? (
              <RemoveButton onClick={() => this.removeOrder(id)} />
            ) : (
              <Fragment>
                {
                  isRequested ? (
                    <Fragment>
                      <div style={{ color: 'red' }}>
                        <FormattedMessage id="Row148" defaultMessage="REQUESTING" />
                      </div>
                      <Link to={`${localisedUrl(locale, links.swap)}/${buyCurrency}-${sellCurrency}/${id}`}>
                        <FormattedMessage id="Row151" defaultMessage="Go to the swap" />
                      </Link>
                    </Fragment>
                  ) : (
                    isProcessing ? (
                      <span>
                        <FormattedMessage id="Row157" defaultMessage="This order is in execution" />
                      </span>
                    ) : (
                      isFetching ? (
                        <Fragment>
                          <InlineLoader />
                          <br />
                          <span>
                            <FormattedMessage id="Row165" defaultMessage="Please wait while we confirm your request" />
                          </span>
                        </Fragment>
                      ) : (
                        <RequestButton
                          disabled={balance >= Number(buyAmount)}
                          onClick={() => this.sendRequest(id, isMy ? sellCurrency : buyCurrency)}
                          data={{ type, amount, main, total, base }}
                        >
                          {type === PAIR_TYPES.BID ? <FormattedMessage id="Row2061" defaultMessage="SELL" /> : <FormattedMessage id="Row206" defaultMessage="BUY" />}
                          {' '}
                          {amount.toFixed(5)}{' '}{main}
                          <br />
                          <FormattedMessage id="Row210" defaultMessage="FOR" />
                          {' '}
                          {total.toFixed(5)}{' '}{base}
                        </RequestButton>
                      )
                    )
                  )
                }
              </Fragment>
            )
          }
        </td>
      </tr>
    )
  }
  renderMobileContent() {
    const { balance, isFetching } = this.state
    const {
      orderId,
      row: {
        id,
        buyCurrency,
        sellCurrency,
        isMy,
        buyAmount,
        sellAmount,
        isRequested,
        isProcessing,
        owner: {  peer: ownerPeer },
      },
      peer,
    } = this.props

    const pair = Pair.fromOrder(this.props.row)

    const { price, amount, total, main, base, type } = pair

    return (
      <tr
        styleName={peer === ownerPeer ? 'mobileRowRemove' : 'mobileRowStart'}
        style={orderId === id ? { background: 'rgba(0, 236, 0, 0.1)' } : {}}
      >
        <td>
          <div styleName="bigContainer">
            <div styleName="tdContainer-1">
              <span styleName="firstType">
                {type === PAIR_TYPES.BID
                  ? (<FormattedMessage id="RowMobileFirstTypeYouHave" defaultMessage="You have" />)
                  : (<FormattedMessage id="RowMobileFirstTypeYouGet" defaultMessage="You get" />)}
              </span>
              <span>{`${amount.toFixed(5)} ${main}`}</span>
            </div>
            <div><i className="fas fa-exchange-alt" /></div>
            <div styleName="tdContainer-2">
              <span styleName="secondType">
                {type === PAIR_TYPES.BID
                  ? (<FormattedMessage id="RowMobileSecondTypeYouGet" defaultMessage="You get" />)
                  : (<FormattedMessage id="RowMobileSecondTypeYouHave" defaultMessage="You have" />)}
              </span>
              <span>{`${total.toFixed(5)} ${base}`}</span>
            </div>
            <div styleName="tdContainer-3">
              {
                peer === ownerPeer ? (
                  <RemoveButton onClick={() => this.removeOrder(id)} />
                ) : (
                  <Fragment>
                    {
                      isRequested ? (
                        <Fragment>
                          <div style={{ color: 'red' }}>
                            <FormattedMessage id="RowM136" defaultMessage="REQUESTING" />
                          </div>
                          <Link to={`${links.swap}/${buyCurrency}-${sellCurrency}/${id}`}>
                            <FormattedMessage id="RowM139" defaultMessage="Go to the swap" />
                          </Link>
                        </Fragment>
                      ) : (
                        isProcessing ? (
                          <span>
                            <FormattedMessage id="RowM145" defaultMessage="This order is in execution" />
                          </span>
                        ) : (
                          isFetching ? (
                            <Fragment>
                              <InlineLoader />
                              <br />
                              <span>
                                <FormattedMessage id="RowM153" defaultMessage="Please wait while we confirm your request" />
                              </span>
                            </Fragment>
                          ) : (
                            <RequestButton
                              styleName={this.state.enterButton ? 'onHover' : 'startButton'}
                              disabled={balance >= Number(buyAmount)}
                              onClick={() => this.sendRequest(id, isMy ? sellCurrency : buyCurrency)}
                              data={{ type, amount, main, total, base }}
                              onMouseEnter={() => this.setState(() => ({ enterButton: true }))}
                              onMouseLeave={() => this.setState(() => ({ enterButton: false }))}
                              move={this.state.enterButton}
                            >
                              <FormattedMessage id="RowM166" defaultMessage="Start" />
                            </RequestButton>
                          )
                        )
                      )
                    }
                  </Fragment>
                )
              }
            </div>
          </div>
        </td>
      </tr>
    )
  }

  renderContent = () => {
    let windowWidthIn = window.outerWidth
    this.setState({ windowWidth: windowWidthIn })
  }

  render() {
    let mobileBreakpoint = 800
    const {
      row: {
        id,
        buyCurrency,
        sellCurrency,
      },
      intl: { locale },
    } = this.props

    if (this.state.redirect) {
      return <Redirect push to={`${localisedUrl(locale, links.swap)}/${buyCurrency}-${sellCurrency}/${id}`} />
    }
    if (this.state.windowWidth < mobileBreakpoint)  {
      return this.renderMobileContent()
    } else {
      return this.renderWebContent()
    }
  }
}

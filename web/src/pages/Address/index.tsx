import React, { useState, useEffect, useContext } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import Pagination from 'rc-pagination'
import 'rc-pagination/assets/index.css'
import localeInfo from 'rc-pagination/lib/locale/en_US'
import queryString from 'query-string'
import AppContext from '../../contexts/App'
import Content from '../../components/Content'
import TransactionComponent from '../../components/Transaction'
import SimpleLabel from '../../components/Label'
import CellConsumedLabel from '../../components/Label/CellConsumedLabel'
import {
  AddressContentPanel,
  AddressTitlePanel,
  AddressOverviewPanel,
  AddressCommonContent,
  AddressScriptContent,
  AddressScriptLabelPanel,
  AddressTransactionsPanel,
  AddressCommonRowPanel,
  AddressTransactionsPagition,
} from './styled'
import CopyIcon from '../../asserts/copy.png'
import BalanceIcon from '../../asserts/address_balance.png'
import CellConsumedIcon from '../../asserts/address_cell_consumed.png'
import AddressScriptIcon from '../../asserts/address_script.png'
import TransactionsIcon from '../../asserts/transactions_green.png'
import { Address, AddressWrapper } from '../../http/response/Address'
import { Response } from '../../http/response/Response'
import { TransactionWrapper } from '../../http/response/Transaction'
import { fetchAddressInfo, fetchTransactionsByAddress } from '../../http/fetcher'
import { copyElementValue, validNumber, shannonToCkb } from '../../utils/util'

const AddressTitle = ({ address }: { address: string }) => {
  const appContext = useContext(AppContext)
  return (
    <AddressTitlePanel>
      <div className="address__title">Address</div>
      <div className="address__content">
        <div id="address__hash">{address}</div>
        <div
          role="button"
          tabIndex={-1}
          onKeyDown={() => {}}
          onClick={() => {
            copyElementValue(document.getElementById('address__hash'))
            appContext.toastMessage('Copied', 3000)
          }}
        >
          <img src={CopyIcon} alt="copy" />
        </div>
      </div>
    </AddressTitlePanel>
  )
}

const AddressOverview = ({ value }: { value: string }) => {
  return <AddressOverviewPanel>{value}</AddressOverviewPanel>
}

const AddressScriptLabel = ({ image, label, value }: { image: string; label: string; value: any }) => {
  return (
    <div>
      <AddressScriptLabelPanel>
        <img src={image} alt={value} />
        <span>{label}</span>
      </AddressScriptLabelPanel>
      <AddressScriptContent value={JSON.stringify(value, null, 4)} readOnly />
    </div>
  )
}

enum PageParams {
  PageNo = 1,
  PageSize = 10,
}

export default (props: React.PropsWithoutRef<RouteComponentProps<{ address: string }>>) => {
  const { match, location } = props
  const { params } = match
  const { address } = params

  const { search } = location
  const parsed = queryString.parse(search)
  const { page, size } = parsed

  const appContext = useContext(AppContext)

  const initTransactionWrappers: TransactionWrapper[] = []
  const initAddress: Address = {
    address_hash: '',
    balance: 0,
    transactions_count: 0,
    cell_consumed: 0,
    lock_script: {
      args: [],
      binary_hash: '',
    },
  }
  const [addressData, setAddressData] = useState(initAddress)
  const [transactionWrappers, setTransactionWrappers] = useState(initTransactionWrappers)
  const [totalTransactions, setTotalTransactions] = useState(1)
  const [pageNo, setPageNo] = useState(validNumber(page, PageParams.PageNo))
  const [pageSize, setPageSize] = useState(validNumber(size, PageParams.PageSize))

  const getAddressInfo = () => {
    appContext.showLoading()
    fetchAddressInfo(address)
      .then(json => {
        appContext.hideLoading()
        const { data } = json as Response<AddressWrapper>
        setAddressData(data.attributes as Address)
      })
      .catch(() => {
        appContext.hideLoading()
      })
  }

  const getTransactions = (page_p: number, size_p: number) => {
    appContext.showLoading()
    fetchTransactionsByAddress(address, page_p, size_p)
      .then(json => {
        appContext.hideLoading()
        const { data, meta } = json as Response<TransactionWrapper[]>
        if (meta) {
          const { total } = meta
          setTotalTransactions(total)
        }
        setTransactionWrappers(data)
      })
      .catch(() => {
        appContext.hideLoading()
      })
  }

  useEffect(() => {
    getAddressInfo()
    const page_p = validNumber(page, PageParams.PageNo)
    const size_p = validNumber(size, PageParams.PageSize)
    setPageNo(page_p)
    setPageSize(size_p)
    getTransactions(page_p, size_p)
  }, [search])

  const onChange = (page_p: number, size_p: number) => {
    setPageNo(page_p)
    setPageSize(size_p)
    props.history.push(`/address/${address}?page=${page_p}&size=${size_p}`)
  }

  return (
    <Content>
      <AddressContentPanel width={window.innerWidth} className="container">
        <AddressTitle address={address} />
        <AddressOverview value="Overview" />
        <AddressCommonContent>
          <AddressCommonRowPanel>
            <SimpleLabel
              image={BalanceIcon}
              label="Balance: "
              value={`${shannonToCkb(addressData.balance)} CKB`}
              style={{
                flexGrow: 1,
              }}
            />
            <SimpleLabel
              image={TransactionsIcon}
              label="Transactions : "
              value={`${addressData.transactions_count}`}
              style={{
                flexGrow: 1,
                marginLeft: 45,
              }}
            />
          </AddressCommonRowPanel>

          <CellConsumedLabel
            image={CellConsumedIcon}
            label="Cell Consumed"
            consumed={addressData.cell_consumed}
          />
          <AddressScriptLabel image={AddressScriptIcon} label="Lock Script: " value={addressData.lock_script} />
        </AddressCommonContent>

        <AddressTransactionsPanel>
          <AddressOverview value="Transactions" />
          <div>
            {transactionWrappers.map((transaction: any) => {
              return (
                <TransactionComponent
                  address={address}
                  transaction={transaction.attributes}
                  key={transaction.attributes.transaction_hash}
                />
              )
            })}
          </div>
          <AddressTransactionsPagition>
            <Pagination
              showQuickJumper
              showSizeChanger
              defaultPageSize={pageSize}
              pageSize={pageSize}
              defaultCurrent={pageNo}
              current={pageNo}
              total={totalTransactions}
              onChange={onChange}
              locale={localeInfo}
            />
          </AddressTransactionsPagition>
        </AddressTransactionsPanel>
      </AddressContentPanel>
    </Content>
  )
}

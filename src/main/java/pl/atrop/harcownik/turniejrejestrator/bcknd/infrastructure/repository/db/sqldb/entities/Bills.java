package pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.repository.db.sqldb.entities;

import jakarta.persistence.Basic;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.NamedQueries;
import jakarta.persistence.NamedQuery;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Date;
import java.util.Set;

/**
 *
 * @author Michał Gnatowski
 * @date 25 wrz 2025
 * @email michal.gnatowski@atrop.pl
 */

@Entity
@Table(name = "bills")
@NamedQueries({
    @NamedQuery(name = "Bills.findAll", query = "SELECT b FROM Bills b"),
    @NamedQuery(name = "Bills.findById", query = "SELECT b FROM Bills b WHERE b.id = :id"),
    @NamedQuery(name = "Bills.findByDatetime", query = "SELECT b FROM Bills b WHERE b.datetime = :datetime"),
    @NamedQuery(name = "Bills.findByPurchaser", query = "SELECT b FROM Bills b WHERE b.purchaser = :purchaser"),
    @NamedQuery(name = "Bills.findByNip", query = "SELECT b FROM Bills b WHERE b.nip = :nip"),
    @NamedQuery(name = "Bills.findByBillNumber", query = "SELECT b FROM Bills b WHERE b.billNumber = :billNumber"),
    @NamedQuery(name = "Bills.findByBillFullnumber", query = "SELECT b FROM Bills b WHERE b.billFullnumber = :billFullnumber"),
    @NamedQuery(name = "Bills.findByPayment1Description", query = "SELECT b FROM Bills b WHERE b.payment1Description = :payment1Description"),
    @NamedQuery(name = "Bills.findByPayment1Value", query = "SELECT b FROM Bills b WHERE b.payment1Value = :payment1Value"),
    @NamedQuery(name = "Bills.findByPayment2Description", query = "SELECT b FROM Bills b WHERE b.payment2Description = :payment2Description"),
    @NamedQuery(name = "Bills.findByPayment2Value", query = "SELECT b FROM Bills b WHERE b.payment2Value = :payment2Value"),
    @NamedQuery(name = "Bills.findByPayment3Description", query = "SELECT b FROM Bills b WHERE b.payment3Description = :payment3Description"),
    @NamedQuery(name = "Bills.findByPayment3Value", query = "SELECT b FROM Bills b WHERE b.payment3Value = :payment3Value"),
    @NamedQuery(name = "Bills.findByPaymentTotal", query = "SELECT b FROM Bills b WHERE b.paymentTotal = :paymentTotal"),
    @NamedQuery(name = "Bills.findByPaymentMethod", query = "SELECT b FROM Bills b WHERE b.paymentMethod = :paymentMethod"),
    @NamedQuery(name = "Bills.findByEmail", query = "SELECT b FROM Bills b WHERE b.email = :email"),
    @NamedQuery(name = "Bills.findBySuffixPdfName", query = "SELECT b FROM Bills b WHERE b.suffixPdfName = :suffixPdfName")})
public class Bills implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Integer id;
    @Basic(optional = false)
    @NotNull
    @Column(name = "datetime")
    @Temporal(TemporalType.TIMESTAMP)
    private Date datetime;
    @Basic(optional = false)
    @NotNull
    @Size(min = 1, max = 120)
    @Column(name = "purchaser")
    private String purchaser;
    @Size(max = 10)
    @Column(name = "nip")
    private String nip;
    @Column(name = "bill_number")
    private Integer billNumber;
    @Size(max = 36)
    @Column(name = "bill_fullnumber")
    private String billFullnumber;
    @Size(max = 128)
    @Column(name = "payment1_description")
    private String payment1Description;
    // @Max(value=?)  @Min(value=?)//if you know range of your decimal fields consider using these annotations to enforce field validation
    @Column(name = "payment1_value")
    private BigDecimal payment1Value;
    @Size(max = 128)
    @Column(name = "payment2_description")
    private String payment2Description;
    @Column(name = "payment2_value")
    private BigDecimal payment2Value;
    @Size(max = 128)
    @Column(name = "payment3_description")
    private String payment3Description;
    @Column(name = "payment3_value")
    private BigDecimal payment3Value;
    @Column(name = "payment_total")
    private BigDecimal paymentTotal;
    @Size(max = 16)
    @Column(name = "payment_method")
    private String paymentMethod;
    // @Pattern(regexp="[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?", message="Invalid email")//if the field contains email address consider using this annotation to enforce field validation
    @Size(max = 512)
    @Column(name = "email")
    private String email;
    @Size(max = 16)
    @Column(name = "suffix_pdf_name")
    private String suffixPdfName;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "billId", fetch = FetchType.LAZY)
    private Set<BillComments> billCommentsSet;
    @JoinColumn(name = "registration_id", referencedColumnName = "id")
    @ManyToOne(fetch = FetchType.LAZY)
    private Registrations registrationId;
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    private Users userId;

    public Bills() {
    }

    public Bills(Integer id) {
        this.id = id;
    }

    public Bills(Integer id, Date datetime, String purchaser) {
        this.id = id;
        this.datetime = datetime;
        this.purchaser = purchaser;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Date getDatetime() {
        return datetime;
    }

    public void setDatetime(Date datetime) {
        this.datetime = datetime;
    }

    public String getPurchaser() {
        return purchaser;
    }

    public void setPurchaser(String purchaser) {
        this.purchaser = purchaser;
    }

    public String getNip() {
        return nip;
    }

    public void setNip(String nip) {
        this.nip = nip;
    }

    public Integer getBillNumber() {
        return billNumber;
    }

    public void setBillNumber(Integer billNumber) {
        this.billNumber = billNumber;
    }

    public String getBillFullnumber() {
        return billFullnumber;
    }

    public void setBillFullnumber(String billFullnumber) {
        this.billFullnumber = billFullnumber;
    }

    public String getPayment1Description() {
        return payment1Description;
    }

    public void setPayment1Description(String payment1Description) {
        this.payment1Description = payment1Description;
    }

    public BigDecimal getPayment1Value() {
        return payment1Value;
    }

    public void setPayment1Value(BigDecimal payment1Value) {
        this.payment1Value = payment1Value;
    }

    public String getPayment2Description() {
        return payment2Description;
    }

    public void setPayment2Description(String payment2Description) {
        this.payment2Description = payment2Description;
    }

    public BigDecimal getPayment2Value() {
        return payment2Value;
    }

    public void setPayment2Value(BigDecimal payment2Value) {
        this.payment2Value = payment2Value;
    }

    public String getPayment3Description() {
        return payment3Description;
    }

    public void setPayment3Description(String payment3Description) {
        this.payment3Description = payment3Description;
    }

    public BigDecimal getPayment3Value() {
        return payment3Value;
    }

    public void setPayment3Value(BigDecimal payment3Value) {
        this.payment3Value = payment3Value;
    }

    public BigDecimal getPaymentTotal() {
        return paymentTotal;
    }

    public void setPaymentTotal(BigDecimal paymentTotal) {
        this.paymentTotal = paymentTotal;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getSuffixPdfName() {
        return suffixPdfName;
    }

    public void setSuffixPdfName(String suffixPdfName) {
        this.suffixPdfName = suffixPdfName;
    }

    public Set<BillComments> getBillCommentsSet() {
        return billCommentsSet;
    }

    public void setBillCommentsSet(Set<BillComments> billCommentsSet) {
        this.billCommentsSet = billCommentsSet;
    }

    public Registrations getRegistrationId() {
        return registrationId;
    }

    public void setRegistrationId(Registrations registrationId) {
        this.registrationId = registrationId;
    }

    public Users getUserId() {
        return userId;
    }

    public void setUserId(Users userId) {
        this.userId = userId;
    }

    @Override
    public int hashCode() {
        int hash = 0;
        hash += (id != null ? id.hashCode() : 0);
        return hash;
    }

    @Override
    public boolean equals(Object object) {
        // TODO: Warning - this method won't work in the case the id fields are not set
        if (!(object instanceof Bills)) {
            return false;
        }
        Bills other = (Bills) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.repository.db.sqldb.entities.Bills[ id=" + id + " ]";
    }

}

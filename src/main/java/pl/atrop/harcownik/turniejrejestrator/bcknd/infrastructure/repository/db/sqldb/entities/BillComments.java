package pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.repository.db.sqldb.entities;

import jakarta.persistence.Basic;
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
import jakarta.persistence.Table;
import jakarta.validation.constraints.Size;
import java.io.Serializable;

/**
 *
 * @author Michał Gnatowski
 * @date 25 wrz 2025
 * @email michal.gnatowski@atrop.pl
 */

@Entity
@Table(name = "bill_comments")
@NamedQueries({
    @NamedQuery(name = "BillComments.findAll", query = "SELECT b FROM BillComments b"),
    @NamedQuery(name = "BillComments.findById", query = "SELECT b FROM BillComments b WHERE b.id = :id"),
    @NamedQuery(name = "BillComments.findByComment", query = "SELECT b FROM BillComments b WHERE b.comment = :comment")})
public class BillComments implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Integer id;
    @Size(max = 512)
    @Column(name = "comment")
    private String comment;
    @JoinColumn(name = "bill_id", referencedColumnName = "id")
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    private Bills billId;

    public BillComments() {
    }

    public BillComments(Integer id) {
        this.id = id;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public Bills getBillId() {
        return billId;
    }

    public void setBillId(Bills billId) {
        this.billId = billId;
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
        if (!(object instanceof BillComments)) {
            return false;
        }
        BillComments other = (BillComments) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.repository.db.sqldb.entities.BillComments[ id=" + id + " ]";
    }

}
